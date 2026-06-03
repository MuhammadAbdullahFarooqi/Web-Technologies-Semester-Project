using Microsoft.Data.Sqlite;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
var app = builder.Build();

// Initialize the database
var connectionString = app.Configuration.GetConnectionString("DefaultConnection");
using (var connection = new SqliteConnection(connectionString))
{
    connection.Open();
    var command = connection.CreateCommand();
    command.CommandText = @"
        CREATE TABLE IF NOT EXISTS Stories (
            Id INTEGER PRIMARY KEY AUTOINCREMENT,
            Title TEXT NOT NULL,
            Description TEXT,
            FileName TEXT NOT NULL,
            UploadDate TEXT NOT NULL
        );
    ";
    command.ExecuteNonQuery();

    // Seed data
    var checkCmd = connection.CreateCommand();
    checkCmd.CommandText = "SELECT COUNT(*) FROM Stories";
    long count = (long)checkCmd.ExecuteScalar()!;
    if (count == 0)
    {
        var seedCmd = connection.CreateCommand();
        seedCmd.CommandText = @"
            INSERT INTO Stories (Title, Description, FileName, UploadDate) VALUES 
            ('A Man of Few Words', 'A short story', 'A Man of Few Words.pdf', '2026-05-20'),
            ('Huzn', 'A short story', 'Huzn .pdf', '2026-05-20'),
            ('The Imperfect Mirror', 'A short story', 'The Imperfect Mirror.pdf', '2026-05-20'),
            ('What I never saw', 'A short story', 'What I never saw.pdf', '2026-05-20')
        ";
        seedCmd.ExecuteNonQuery();
    }
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(); // This generates the browser UI page
}

app.UseCors("AllowAll");

// Serve Angular static files
app.UseDefaultFiles();
app.UseStaticFiles();

app.UseAuthorization();

app.MapControllers();

// Fallback to Angular index.html for SPA routing
app.MapFallbackToFile("index.html");

app.Run();
