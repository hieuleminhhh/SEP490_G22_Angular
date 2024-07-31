import { Pipe, PipeTransform } from '@angular/core';
import { formatDate, registerLocaleData } from '@angular/common';
import localeVi from '@angular/common/locales/vi';

// Đăng ký locale nếu chưa làm
registerLocaleData(localeVi, 'vi-VN');

@Pipe({
  name: 'dateFormat',
  standalone: true
})
export class DateFormatPipe implements PipeTransform {
  transform(value: string | Date, format: string = 'dd/MM/yyyy HH:mm', locale: string = 'vi-VN'): string {
    if (!value) return '';

    let date: Date;
    if (typeof value === 'string') {
      date = new Date(value);
      if (isNaN(date.getTime())) {
        return value;
      }
    } else {
      date = value;
    }
    return formatDate(date, format, locale);
  }
}
