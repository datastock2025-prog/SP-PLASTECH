import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class SensitiveDataMaskingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const isUnmaskRequested = request.headers['x-unmask-pii'] === 'true';

    return next.handle().pipe(
      map((data) => {
        if (!data || isUnmaskRequested) return data;
        return this.maskObject(data);
      })
    );
  }

  private maskObject(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map((item) => this.maskObject(item));
    }
    if (obj !== null && typeof obj === 'object') {
      const cloned = { ...obj };
      for (const key of Object.keys(cloned)) {
        const lowerKey = key.toLowerCase();
        if (typeof cloned[key] === 'string') {
          if (lowerKey.includes('ssn') || lowerKey.includes('aadhaar')) {
            cloned[key] = `***-**-${cloned[key].slice(-4)}`;
          } else if (lowerKey.includes('bankaccount') || lowerKey.includes('accountnumber')) {
            cloned[key] = `**** **** **** ${cloned[key].slice(-4)}`;
          } else if (lowerKey.includes('pan')) {
            cloned[key] = `*****${cloned[key].slice(-4)}`;
          } else if (lowerKey.includes('salary') || lowerKey.includes('wage')) {
            cloned[key] = `₹ **,**,***`;
          }
        } else if (typeof cloned[key] === 'object') {
          cloned[key] = this.maskObject(cloned[key]);
        }
      }
      return cloned;
    }
    return obj;
  }
}
