/**
 * Global system settings configuration for mock DB.
 */

export interface SystemSettings {
  approvalSettings: {
    orderApprovalThresholdEur: number;
    approvalRequiredCategories: string[];
    defaultApproverRole: string;
  };
  slaSettings: {
    orderDeliveryWarningDays: number;
    periodicTaskOverdueGraceHours: number;
  };
  notificationSettings: {
    notifyOnOrderSubmitted: boolean;
    notifyOnOrderApproved: boolean;
    notifyOnOrderRejected: boolean;
    notifyOnDeliveryOverdue: boolean;
    notifyOnPeriodicTaskOverdue: boolean;
  };
}

/**
 * System-wide configuration object.
 */
export const systemSettings: SystemSettings = {
  approvalSettings: {
    orderApprovalThresholdEur: 500,
    approvalRequiredCategories: ["EQUIPMENT", "MAINTENANCE", "IT"],
    defaultApproverRole: "OPS"
  },
  slaSettings: {
    orderDeliveryWarningDays: 3,
    periodicTaskOverdueGraceHours: 2
  },
  notificationSettings: {
    notifyOnOrderSubmitted: true,
    notifyOnOrderApproved: true,
    notifyOnOrderRejected: true,
    notifyOnDeliveryOverdue: true,
    notifyOnPeriodicTaskOverdue: true
  }
};
