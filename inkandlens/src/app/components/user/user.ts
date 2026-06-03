import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { StoriesService } from '../../services/stories';
import { Story } from '../../models/story';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user.html',
  styleUrl: './user.css'
})
export class UserPortal implements OnInit {
  stories: Story[] = [];
  loading = true;
  downloadingId: number | null = null;

  constructor(private storiesService: StoriesService, private router: Router, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.loadStories();
  }

  loadStories() {
    this.loading = true;
    this.storiesService.getStories().subscribe({
      next: (data) => {
        this.stories = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load stories', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  downloadStory(story: Story) {
    this.downloadingId = story.id;
    this.cdr.detectChanges();
    this.storiesService.downloadStory(story.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = story.fileName.substring(story.fileName.indexOf('_') + 1) || 'story.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.downloadingId = null;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to download story file', err);
        alert('Could not download file. It might be missing from the server.');
        this.downloadingId = null;
        this.cdr.detectChanges();
      }
    });
  }

  logout() {
    this.router.navigate(['/login']);
  }
}
