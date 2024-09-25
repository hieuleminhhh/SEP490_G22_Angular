import { Component, OnInit } from '@angular/core';
import { ArticleService } from '../../../service/news.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CurrencyFormatPipe } from '../material/currencyFormat/currencyFormat.component';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-news',
  standalone:true,
  templateUrl: './news.component.html',
  styleUrls: ['./news.component.css'],
  imports: [CommonModule, FormsModule, CurrencyFormatPipe]
})
export class NewsComponent implements OnInit {
  articles :any; // Danh sách bài viết
  selectedArticle: any = null; // Bài viết được chọn
  constructor(private articleService: ArticleService, private titleService: Title) {}

  ngOnInit() {
    this.selectArticle();
    this.titleService.setTitle('Bài viết | Eating House');
  }
  selectArticle() {
    this.articleService.getArticle().subscribe(
      (response) => {
        this.articles = response;
      },
      (error) => {
        console.error('Error fetching article details', error);
      }
    );
  }

  onSelectArticle(article: any) {
    this.selectedArticle = article;
  }
}
