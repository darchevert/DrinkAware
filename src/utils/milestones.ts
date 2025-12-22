import { Milestone } from '../types/SobrietyTypes';

type TFunc = (key: any, params?: Record<string, string | number>) => string;

export function buildDefaultMilestones(t: TFunc): Milestone[] {
  return [
    { id: '1', name: t('milestones.m1_name'), daysRequired: 1, achieved: false, description: t('milestones.m1_desc') },
    { id: '2', name: t('milestones.m2_name'), daysRequired: 7, achieved: false, description: t('milestones.m2_desc') },
    { id: '3', name: t('milestones.m3_name'), daysRequired: 10, achieved: false, description: t('milestones.m3_desc') },
    { id: '4', name: t('milestones.m4_name'), daysRequired: 14, achieved: false, description: t('milestones.m4_desc') },
    { id: '5', name: t('milestones.m5_name'), daysRequired: 30, achieved: false, description: t('milestones.m5_desc') },
    { id: '6', name: t('milestones.m6_name'), daysRequired: 60, achieved: false, description: t('milestones.m6_desc') },
    { id: '7', name: t('milestones.m7_name'), daysRequired: 90, achieved: false, description: t('milestones.m7_desc') },
    { id: '8', name: t('milestones.m8_name'), daysRequired: 180, achieved: false, description: t('milestones.m8_desc') },
    { id: '9', name: t('milestones.m9_name'), daysRequired: 365, achieved: false, description: t('milestones.m9_desc') },
    { id: '10', name: t('milestones.m10_name'), daysRequired: 45, achieved: false, description: t('milestones.m10_desc') },
    { id: '11', name: t('milestones.m11_name'), daysRequired: 75, achieved: false, description: t('milestones.m11_desc') },
    { id: '12', name: t('milestones.m12_name'), daysRequired: 100, achieved: false, description: t('milestones.m12_desc') },
    { id: '13', name: t('milestones.m13_name'), daysRequired: 150, achieved: false, description: t('milestones.m13_desc') },
    { id: '14', name: t('milestones.m14_name'), daysRequired: 200, achieved: false, description: t('milestones.m14_desc') },
    { id: '15', name: t('milestones.m15_name'), daysRequired: 250, achieved: false, description: t('milestones.m15_desc') },
    { id: '16', name: t('milestones.m16_name'), daysRequired: 300, achieved: false, description: t('milestones.m16_desc') },
    { id: '17', name: t('milestones.m17_name'), daysRequired: 500, achieved: false, description: t('milestones.m17_desc') },
    { id: '18', name: t('milestones.m18_name'), daysRequired: 730, achieved: false, description: t('milestones.m18_desc') },
    { id: '19', name: t('milestones.m19_name'), daysRequired: 1000, achieved: false, description: t('milestones.m19_desc') },
    { id: '20', name: t('milestones.m20_name'), daysRequired: 1095, achieved: false, description: t('milestones.m20_desc') },
    { id: '21', name: t('milestones.m21_name'), daysRequired: 1460, achieved: false, description: t('milestones.m21_desc') },
    { id: '22', name: t('milestones.m22_name'), daysRequired: 1825, achieved: false, description: t('milestones.m22_desc') },
    { id: '23', name: t('milestones.m23_name'), daysRequired: 2190, achieved: false, description: t('milestones.m23_desc') },
    { id: '24', name: t('milestones.m24_name'), daysRequired: 2555, achieved: false, description: t('milestones.m24_desc') },
    { id: '25', name: t('milestones.m25_name'), daysRequired: 2920, achieved: false, description: t('milestones.m25_desc') },
    { id: '26', name: t('milestones.m26_name'), daysRequired: 3285, achieved: false, description: t('milestones.m26_desc') },
    { id: '27', name: t('milestones.m27_name'), daysRequired: 3650, achieved: false, description: t('milestones.m27_desc') },
    { id: '28', name: t('milestones.m28_name'), daysRequired: 2000, achieved: false, description: t('milestones.m28_desc') },
    { id: '29', name: t('milestones.m29_name'), daysRequired: 3000, achieved: false, description: t('milestones.m29_desc') },
    { id: '30', name: t('milestones.m30_name'), daysRequired: 4000, achieved: false, description: t('milestones.m30_desc') },
  ];
}


