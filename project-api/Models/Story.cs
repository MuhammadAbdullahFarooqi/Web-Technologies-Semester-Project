namespace InkAndLensApi.Models
{
    public class Story
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string FileName { get; set; } = string.Empty;
        public string UploadDate { get; set; } = string.Empty;
    }
}