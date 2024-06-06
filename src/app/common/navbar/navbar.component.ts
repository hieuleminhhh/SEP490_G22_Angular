import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CartService } from '../../../service/cart.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {

  itemCount: number = 0;

  constructor(private cartService: CartService) { }

  ngOnInit(): void {
    this.cartService.getItemCount().subscribe(count => {
      this.itemCount = count;
    });
  }

}
