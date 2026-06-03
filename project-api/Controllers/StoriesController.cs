using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.Sqlite;
using InkAndLensApi.Models;

namespace InkAndLensApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class StoriesController : ControllerBase
    {
        private readonly string _connectionString;

        public StoriesController(IConfiguration configuration)
        {
            // Pulls our SQLite connection setup from appsettings.json
            _connectionString = configuration.GetConnectionString("DefaultConnection")!;
        }

        // ==========================================
        // USER PORTAL APIS
        // ==========================================

        /// <summary>
        /// Fetch all short stories listed in the system
        /// </summary>
        [HttpGet]
        public IActionResult GetAllStories()
        {
            var stories = new List<Story>();

            using (var connection = new SqliteConnection(_connectionString))
            {
                connection.Open();
                var command = connection.CreateCommand();
                command.CommandText = "SELECT Id, Title, Description, FileName, UploadDate FROM Stories";

                using (var reader = command.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        stories.Add(new Story
                        {
                            Id = reader.GetInt32(0),
                            Title = reader.GetString(1),
                            Description = reader.IsDBNull(2) ? "" : reader.GetString(2),
                            FileName = reader.GetString(3),
                            UploadDate = reader.GetString(4)
                        });
                    }
                }
            }
            return Ok(stories);
        }

        /// <summary>
        /// Stream a short story PDF directly to the user portal
        /// </summary>
        [HttpGet("download/{id}")]
        public IActionResult DownloadStoryFile(int id)
        {
            string fileName = string.Empty;

            using (var connection = new SqliteConnection(_connectionString))
            {
                connection.Open();
                var command = connection.CreateCommand();
                command.CommandText = "SELECT FileName FROM Stories WHERE Id = @Id";
                command.Parameters.AddWithValue("@Id", id);

                var result = command.ExecuteScalar();
                if (result == null) return NotFound("Story record could not be found in the database.");

                fileName = result.ToString()!;
            }

            // Target the location of the file within our project filesystem
            var pathToFile = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", fileName);

            if (!System.IO.File.Exists(pathToFile))
                return NotFound("The physical PDF story file is missing from the server storage.");

            var fileBytes = System.IO.File.ReadAllBytes(pathToFile);

            // Returns file directly as application/pdf so the browser can display or download it
            return File(fileBytes, "application/pdf", fileName);
        }

        // ==========================================
        // ADMIN PORTAL APIS
        // ==========================================

        /// <summary>
        /// Upload a new short story PDF and write details to database
        /// </summary>
        [HttpPost("upload")]
        public async Task<IActionResult> UploadStoryFile([FromForm] string title, [FromForm] string description, IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("Invalid request. A valid PDF file must be provided.");

            // 1. Physically save file to wwwroot/uploads directory
            var localUploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");

            // Generate an unique name variant to prevent duplication overrides on disk
            var uniquelyGeneratedName = Guid.NewGuid().ToString() + "_" + file.FileName;
            var pathTarget = Path.Combine(localUploadsFolder, uniquelyGeneratedName);

            using (var streamEngine = new FileStream(pathTarget, FileMode.Create))
            {
                await file.CopyToAsync(streamEngine);
            }

            // 2. Run raw SQL ADO.NET command to link file references into database
            using (var connection = new SqliteConnection(_connectionString))
            {
                connection.Open();
                var command = connection.CreateCommand();
                command.CommandText = @"
                    INSERT INTO Stories (Title, Description, FileName, UploadDate) 
                    VALUES (@Title, @Description, @FileName, @UploadDate)";

                command.Parameters.AddWithValue("@Title", title);
                command.Parameters.AddWithValue("@Description", description);
                command.Parameters.AddWithValue("@FileName", uniquelyGeneratedName);
                command.Parameters.AddWithValue("@UploadDate", DateTime.UtcNow.ToString("yyyy-MM-dd"));

                command.ExecuteNonQuery();
            }

            return Ok(new { message = "Story details recorded and file uploaded successfully!" });
        }

        /// <summary>
        /// Delete a story from database and remove its physical PDF file
        /// </summary>
        [HttpDelete("{id}")]
        public IActionResult DeleteStory(int id)
        {
            string fileName = string.Empty;

            using (var connection = new SqliteConnection(_connectionString))
            {
                connection.Open();

                // 1. Get the filename to delete physical file
                var selectCommand = connection.CreateCommand();
                selectCommand.CommandText = "SELECT FileName FROM Stories WHERE Id = @Id";
                selectCommand.Parameters.AddWithValue("@Id", id);

                var result = selectCommand.ExecuteScalar();
                if (result == null)
                {
                    return NotFound("Story record could not be found in the database.");
                }
                fileName = result.ToString()!;

                // 2. Delete from database
                var deleteCommand = connection.CreateCommand();
                deleteCommand.CommandText = "DELETE FROM Stories WHERE Id = @Id";
                deleteCommand.Parameters.AddWithValue("@Id", id);
                deleteCommand.ExecuteNonQuery();
            }

            // 3. Delete physical file
            var pathToFile = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", fileName);
            if (System.IO.File.Exists(pathToFile))
            {
                try
                {
                    System.IO.File.Delete(pathToFile);
                }
                catch (Exception ex)
                {
                    // Log or handle file delete failure if needed, but database row is already deleted
                    Console.WriteLine($"Failed to delete physical file: {ex.Message}");
                }
            }

            return Ok(new { message = "Story deleted successfully!" });
        }
    }
}