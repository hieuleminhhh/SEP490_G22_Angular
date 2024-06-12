import { Component, OnDestroy, OnInit } from '@angular/core';
import { CartService } from '../../../service/cart.service';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { Dish } from '../../../models/dish.model';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CheckoutService } from '../../../service/checkout.service';
import { FormsModule } from '@angular/forms';
import { OrderDetail } from '../../../models/orderDetail.model';
import { Address } from '../../../models/address.model';

@Component({
  selector: 'app-cart',
  standalone: true,
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css'],
  imports: [CommonModule, RouterLink, RouterLinkActive, FormsModule]
})
export class CartComponent implements OnInit, OnDestroy {

  cartItems: Dish[] = [];
  guest: Address[] = [];
  itemQuantityMap: { [key: string]: number } = {};
  itemCount: number = 0;

  consigneeName: string = '';
  guestPhone: string = '';
  email: string = '';
  address: string = '';
  note: string = '';
  date: string = '';
  time: string = '';
  selectedPaymentMethod: string = 'cash-on-delivery';

  private cartSubscription!: Subscription;
  private itemCountSubscription!: Subscription;

  constructor(
    private cartService: CartService,
    private router: Router,
    private route: ActivatedRoute,
    private checkoutService: CheckoutService
  ) { }

  ngOnInit() {
    this.cartSubscription = this.cartService.getCart().subscribe(cartItems => {
      this.cartItems = cartItems;
      this.calculateItemQuantity();
    });

    this.itemCountSubscription = this.cartService.getItemCount().subscribe(count => {
      this.itemCount = count;
    });

    this.route.queryParams.subscribe(params => {
      if (params['data']) {
        const reorderData = JSON.parse(params['data']);
        this.processReorderData(reorderData);
      }
    });
    this.cartService.getGuestInfo().subscribe(info => {
      if (info) {
        this.address = info.guestAddress;
        this.consigneeName = info.consigneeName;
        this.guestPhone = info.guestPhone;
        this.email = info.email;
      }
    });
  }

  calculateItemQuantity() {
    this.itemQuantityMap = {};
    this.cartItems.forEach(item => {
      const itemName = item.itemName;
      this.itemQuantityMap[itemName] = item.quantity;
    });
  }

  getTotalPrice(item: any): number {
    const price = item.discountedPrice != null ? item.discountedPrice : item.price;
    console.log(price);
    return parseFloat((item.quantity * price).toFixed(2));
  }


  getTotalCartPrice(): number {
    return parseFloat(this.cartItems.reduce((total, item) => {
      const price = item.discountedPrice != null ? item.discountedPrice : item.price;
      return total + (price * item.quantity);
    }, 0).toFixed(2));
  }

  getItemNames(): string[] {
    return Object.keys(this.itemQuantityMap);
  }

  decreaseQuantity(item: any) {
    if (item.quantity > 1) {
      item.quantity--;
      this.cartService.updateCart(this.cartItems);
    }
  }

  increaseQuantity(item: any) {
    item.quantity++;
    this.cartService.updateCart(this.cartItems);
  }

  removeItem(item: any) {
    if (item.hasOwnProperty('dishId')) {
      this.cartService.removeFromCart(item.dishId, 'Dish');
    } else if (item.hasOwnProperty('comboId')) {
      this.cartService.removeFromCart(item.comboId, 'Combo');
    }
  }

  ngOnDestroy() {
    this.cartSubscription.unsubscribe();
    this.itemCountSubscription.unsubscribe();
  }

  navigateToPayment(): void {
    const receivingTime = this.formatDateTime(this.date, this.time);
    const request = {
      guestPhone: this.guestPhone,
      email: this.email,
      addressId: 0,
      guestAddress: this.address,
      consigneeName: this.consigneeName,
      orderDate: new Date().toISOString(),
      status: 0,
      recevingOrder: receivingTime,
      totalAmount: 0,
      deposits: 0,
      cartItems: this.cartItems.map(item => ({
        unitPrice: this.getTotalPrice(item),
        quantity: item.quantity,
        note: this.note,
        dishId: item.dishId,
        orderId: 0,
        dishesServed: 0,
        comboId: item.comboId
      }))
    };
    console.log(request);
    this.checkoutService.submitOrder(request).subscribe({
      next: response => {
        console.log('Order submitted successfully', response);
        this.cartService.clearCart();
        if (this.selectedPaymentMethod === 'banking') {
          // Chuyển hướng đến trang quét mã nếu chọn "Paying through bank"
          this.router.navigate(['/payment-scan'], { queryParams: { guestPhone: this.guestPhone } });
        } else {
          // Chuyển hướng đến trang thanh toán thông thường
          this.router.navigate(['/payment'], { queryParams: { guestPhone: this.guestPhone } });
        }
      },
      error: error => {
        console.error('Error submitting order', error);
      }
    });
  }

  formatDateTime(date: string, time: string): string {
    return `${date}T${time}:00.000Z`;
  }

  processReorderData(data: any) {
    // Gán orderDetails vào cartItems
    if (data && Array.isArray(data.orderDetails)) {
      this.cartItems = data.orderDetails.map((item: any) => ({
        ...item,
        nameCombo: item.nameCombo,
        itemName: item.itemName,
        unitPrice: item.unitPrice,
        quantity: item.quantity
      }));
      console.log(data.addressId);
      // Gọi API getGuest để lấy thông tin khách hàng
      this.cartService.getGuest(data.addressId).subscribe(
        (response: Address) => {
          this.guest = [{
            addressId: response.addressId,
            guestAddress: response.guestAddress,
            consigneeName: response.consigneeName,
            guestPhone: response.guestPhone,
            email: response.email
          }];
          this.address = response.guestAddress;
          this.consigneeName = response.consigneeName;
          this.guestPhone = response.guestPhone;
          this.email = response.email;

          this.cartService.setGuestInfo(response);
          // Sau khi đã có đủ thông tin từ response, thực hiện các hành động tiếp theo
          this.calculateItemQuantity();
          this.cartService.updateCart(this.cartItems);
          console.log('Cart items after reorder:', this.cartItems);
          console.log('Guest information:', {
            address: this.address,
            consigneeName: this.consigneeName,
            guestPhone: this.guestPhone,
            email: this.email
          });
        },
        error => {
          console.error('Error fetching guest data:', error);
        }
      );
    } else {
      console.error('Invalid orderDetails format for reorder:', data);
    }
  }

}

