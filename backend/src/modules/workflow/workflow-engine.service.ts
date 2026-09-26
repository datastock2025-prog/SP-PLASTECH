import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { Decimal } from 'decimal.js';

export interface WorkflowTransition {
  fromState: string;
  toState: string;
  action: string;
  requiredRole?: string;
  condition?: {
    field: string;
    operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
    value: number | string | boolean;
  };
}

export interface WorkflowDefinition {
  id: string;
  tenantId: string;
  entityType: 'PURCHASE_ORDER' | 'SALES_ORDER' | 'WORK_ORDER' | 'MAINTENANCE_LOG';
  initialState: string;
  finalStates: string[];
  transitions: WorkflowTransition[];
}

export interface WorkflowInstance {
  id: string;
  tenantId: string;
  workflowDefinitionId: string;
  entityId: string;
  currentState: string;
  history: {
    fromState: string;
    toState: string;
    action: string;
    performedBy: string;
    timestamp: string;
    comments?: string;
  }[];
}

@Injectable()
export class WorkflowEngineService {
  private readonly logger = new Logger(WorkflowEngineService.name);

  // In-memory definitions registry (Can be backed by database)
  private readonly definitions = new Map<string, WorkflowDefinition>([
    [
      'PO_DEFAULT',
      {
        id: 'PO_DEFAULT',
        tenantId: 'GLOBAL',
        entityType: 'PURCHASE_ORDER',
        initialState: 'DRAFT',
        finalStates: ['APPROVED', 'REJECTED', 'CANCELLED'],
        transitions: [
          { fromState: 'DRAFT', toState: 'PENDING_APPROVAL', action: 'SUBMIT_FOR_APPROVAL' },
          {
            fromState: 'PENDING_APPROVAL',
            toState: 'MANAGER_APPROVED',
            action: 'APPROVE_LEVEL_1',
            condition: { field: 'amount', operator: '>', value: 50000 },
          },
          { fromState: 'PENDING_APPROVAL', toState: 'APPROVED', action: 'DIRECT_APPROVE' },
          { fromState: 'MANAGER_APPROVED', toState: 'APPROVED', action: 'FINAL_APPROVE', requiredRole: 'FINANCE_HEAD' },
          { fromState: 'PENDING_APPROVAL', toState: 'REJECTED', action: 'REJECT' },
          { fromState: 'MANAGER_APPROVED', toState: 'REJECTED', action: 'REJECT' },
        ],
      },
    ],
  ]);

  /**
   * Evaluate if a transition condition matches entity payload
   */
  evaluateCondition(condition: WorkflowTransition['condition'], entityData: Record<string, any>): boolean {
    if (!condition) return true;

    const actualVal = entityData[condition.field];
    if (actualVal === undefined) return false;

    if (typeof actualVal === 'number' || actualVal instanceof Decimal) {
      const actualDec = new Decimal(actualVal);
      const targetDec = new Decimal(condition.value as number);

      switch (condition.operator) {
        case '>':
          return actualDec.gt(targetDec);
        case '>=':
          return actualDec.gte(targetDec);
        case '<':
          return actualDec.lt(targetDec);
        case '<=':
          return actualDec.lte(targetDec);
        case '==':
          return actualDec.eq(targetDec);
        case '!=':
          return !actualDec.eq(targetDec);
      }
    }

    switch (condition.operator) {
      case '==':
        return actualVal === condition.value;
      case '!=':
        return actualVal !== condition.value;
      default:
        return false;
    }
  }

  /**
   * Transition instance to next state
   */
  async transitionState(
    instance: WorkflowInstance,
    action: string,
    performedBy: string,
    entityData: Record<string, any> = {},
    userRole?: string,
    comments?: string,
  ): Promise<WorkflowInstance> {
    const definition = this.definitions.get(instance.workflowDefinitionId) || this.definitions.get('PO_DEFAULT');
    if (!definition) {
      throw new BadRequestException(`Workflow definition not found: ${instance.workflowDefinitionId}`);
    }

    const availableTransitions = definition.transitions.filter(
      (t) => t.fromState === instance.currentState && t.action === action,
    );

    if (availableTransitions.length === 0) {
      throw new BadRequestException(
        `Action "${action}" is not valid from current state "${instance.currentState}"`,
      );
    }

    // Match transition matching role and conditions
    let matchedTransition: WorkflowTransition | null = null;
    for (const trans of availableTransitions) {
      if (trans.requiredRole && trans.requiredRole !== userRole) {
        continue;
      }
      if (trans.condition && !this.evaluateCondition(trans.condition, entityData)) {
        continue;
      }
      matchedTransition = trans;
      break;
    }

    if (!matchedTransition) {
      throw new BadRequestException(`Conditions or role requirements not met for action: ${action}`);
    }

    const previousState = instance.currentState;
    instance.currentState = matchedTransition.toState;
    instance.history.push({
      fromState: previousState,
      toState: matchedTransition.toState,
      action,
      performedBy,
      timestamp: new Date().toISOString(),
      comments,
    });

    this.logger.log(
      `Workflow ${instance.id} [${definition.entityType}] transitioned: ${previousState} -> ${instance.currentState} by ${performedBy}`,
    );

    return instance;
  }
}
