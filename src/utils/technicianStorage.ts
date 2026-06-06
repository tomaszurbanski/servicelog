import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@servicelog_technician';

export interface TechnicianInfo {
  name: string;
  company: string;
  phone: string;
}

const defaults: TechnicianInfo = { name: '', company: '', phone: '' };

export const getTechnician = async (): Promise<TechnicianInfo> => {
  const data = await AsyncStorage.getItem(KEY);
  return data ? { ...defaults, ...JSON.parse(data) } : defaults;
};

export const saveTechnician = async (info: TechnicianInfo): Promise<void> => {
  await AsyncStorage.setItem(KEY, JSON.stringify(info));
};
