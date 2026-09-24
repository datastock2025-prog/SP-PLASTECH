import { Injectable } from '@nestjs/common';
import { ObservabilityLogger } from './logger.service';

export interface AlertRule {
  id: string;
  name: string;
  metric: string;
  condition: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  threshold: number;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  message: string;
  channels: string[];
}

@Injectable()
export class AlertingService {
  private rules: AlertRule[] = [];
  private alertHistory: any[] = [];

  constructor(private readonly logger: ObservabilityLogger) {
    this.initializeDefaultRules();
  }

  private initializeDefaultRules() {
    this.rules = [
      {
        id: 'HIGH_ERROR_RATE',
        name: 'High Error Rate Alert',
        metric: 'http_requests_5xx',
        condition: 'gt',
        threshold: 20,
        severity: 'CRITICAL',
        message: 'High 5xx error rate detected across Operations API endpoints.',
        channels: ['EMAIL', 'SLACK'],
      },
      {
        id: 'SLOW_RESPONSE',
        name: 'Slow Query Latency',
        metric: 'db_latency_ms',
        condition: 'gt',
        threshold: 200,
        severity: 'WARNING',
        message: 'Database query execution time exceeded 200ms threshold.',
        channels: ['SLACK'],
      },
      {
        id: 'LOW_STOCK',
        name: 'Raw Material Safety Stock Breach',
        metric: 'raw_material_kg',
        condition: 'lt',
        threshold: 500,
        severity: 'WARNING',
        message: 'PP Homo-polymer stock has dropped below reorder buffer.',
        channels: ['EMAIL', 'IN_APP'],
      },
      {
        id: 'MACHINE_DOWNTIME',
        name: 'Unplanned IMM Machine Halt',
        metric: 'unplanned_downtime_min',
        condition: 'gt',
        threshold: 60,
        severity: 'CRITICAL',
        message: 'IMM-02 has been idle / breakdown for over 60 minutes.',
        channels: ['EMAIL', 'SLACK', 'SMS'],
      },
    ];
  }

  public getRules(): AlertRule[] {
    return this.rules;
  }

  public getAlertHistory(): any[] {
    return this.alertHistory.length > 0
      ? this.alertHistory
      : [
          {
            id: 'ALT-101',
            ruleId: 'LOW_STOCK',
            ruleName: 'Raw Material Safety Stock Breach',
            severity: 'WARNING',
            message: 'Polypropylene PP-HOMO-092 below 500 KG reorder point at Silo-02.',
            currentValue: 320,
            threshold: 500,
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            status: 'ACKNOWLEDGED',
          },
          {
            id: 'ALT-102',
            ruleId: 'MACHINE_DOWNTIME',
            ruleName: 'Unplanned IMM Machine Halt',
            severity: 'CRITICAL',
            message: 'Machine IMM-250T-01 heater band thermocouple alert triggered.',
            currentValue: 72,
            threshold: 60,
            timestamp: new Date(Date.now() - 7200000).toISOString(),
            status: 'RESOLVED',
          },
        ];
  }

  public triggerAlert(rule: AlertRule, currentValue: number) {
    const alert = {
      id: `ALT-${Date.now().toString().slice(-4)}`,
      ruleId: rule.id,
      ruleName: rule.name,
      severity: rule.severity,
      message: rule.message,
      currentValue,
      threshold: rule.threshold,
      timestamp: new Date().toISOString(),
      status: 'ACTIVE',
    };
    this.alertHistory.unshift(alert);
    this.logger.logAlert(rule.severity, rule.message, alert);
  }
}
