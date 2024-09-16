import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AccountService } from '../../../../../service/account.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-OtpVerification',
  templateUrl: './OtpVerification.component.html',
  styleUrls: ['./OtpVerification.component.css'],
  imports: [CommonModule, FormsModule],
  standalone: true,
})
export class OtpVerificationComponent implements OnInit {

  token: string = '';
  email: string = '';
  generatedOtp: string = '';
  userOtp: string = '';
  verificationMessage: string = '';
  isSuccess: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private accountService: AccountService
  ) { }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.token = params['token'];
      this.email = params['email'];
      this.generatedOtp = params['otp'];
    });
  }

  onSubmit(): void {
    if (this.userOtp === this.generatedOtp) {
      this.verificationMessage = 'Xác nhận thành công.';
      this.isSuccess = true;
      this.proceedToRegisterGoogleAccount(this.token, this.email);
    } else {
      this.verificationMessage = 'Mã xác nhận không chính xác, vui lòng thử lại !!!';
      this.isSuccess = false;
    }
  }

  private proceedToRegisterGoogleAccount(token: string, email: string): void {
    this.accountService.registerGoogleAccount(email).subscribe(
      registerResponse => {
        console.log('Google account registered:', registerResponse);

        // Store token and profile data in localStorage
        localStorage.setItem('token', registerResponse.token);
        localStorage.setItem('accountId', registerResponse.accountId.toString());

        // Display success message and navigate after a delay
        this.showSuccessMessageAndRedirect(registerResponse.role);
      },
      registerError => {
        console.error('Error registering Google account', registerError);
        this.verificationMessage = 'Xác thực không thành công vui lòng thử lại';
        this.isSuccess = false;
      }
    );
  }

  private showSuccessMessageAndRedirect(role: string): void {
    // Display the success message
    this.verificationMessage = 'Xác thực thành công';
    this.isSuccess = true;

    // Wait for 3 seconds before redirecting
    setTimeout(() => {
      this.handleUserRole(role);
    }, 1000); 
  }


  handleUserRole(role: string) {
    switch (role) {
      case 'User':
        window.location.href = '/';
        break;
      case 'Chef':
        window.location.href = '/cooking';
        break;
      case 'Cashier':
        window.location.href = '/dashboard';
        break;
      case 'Admin':
        window.location.href = '/setting';
        break;
      case 'Manager':
        window.location.href = '/managerdish';
        break;
      case 'OrderStaff':
        window.location.href = '/listTable';
        break;
      case 'Ship':
        window.location.href ='/shipping';
        break;
      default:
        console.error('Unknown role:', role);
        break;
    }
  }
}
