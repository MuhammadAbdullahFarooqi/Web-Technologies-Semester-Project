import { Component, OnInit } from '@angular/core';
import { StoriesService } from '../../services/stories';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-home',
  imports: [CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  stories: any[] = [];
  constructor(private storyService: StoriesService){}
  ngOnInit(){
    this.loadStories();
  }
  loadStories(){
    this.storyService.getStories().subscribe((data: any) => {
      this.stories = data;
      console.log(data);
    });
  }
}
