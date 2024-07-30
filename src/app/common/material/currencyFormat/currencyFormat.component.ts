import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'currencyFormat',
  standalone: true
})
export class CurrencyFormatPipe implements PipeTransform {

  transform(value: number, currencySymbol: string = 'đ'): string {
    if (value == null) return '';
    const formattedValue = value.toLocaleString('vi-VN');
    return `${formattedValue}${currencySymbol}`;
  }

}
