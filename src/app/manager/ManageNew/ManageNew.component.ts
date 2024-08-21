import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // Import CommonModule
@Component({
  selector: 'app-manage-new',
  templateUrl: './ManageNew.component.html',
  styleUrls: ['./ManageNew.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class ManageNewComponent implements OnInit {

  constructor() { }

  newsItems = [
    { NewsID: 1, NewsTitle: 'Item 1', NewsContent: 'Description for item 1', NewsDate: new Date(), AccountID: 101, ImageUrl: 'https://th.bing.com/th/id/OIP.mKZw98Zy6OgQHAqhTP_SvQHaFP?w=263&h=180&c=7&r=0&o=5&dpr=1.3&pid=1.7' },
    { NewsID: 2, NewsTitle: 'Item 2', NewsContent: 'Description for item 2', NewsDate: new Date(), AccountID: 102, ImageUrl: 'https://th.bing.com/th/id/OIP.ECFpBUVQIHUB3pL7SVBvzAHaHa?w=167&h=180&c=7&r=0&o=5&dpr=1.3&pid=1.7' },
    // Add more items as needed
  ];

  ngOnInit() {
  }

}
