import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import SalesScreen from '../screens/employee/SalesScreen';
import PosHomeScreen from '../screens/pos/PosHomeScreen';
import SalesHistoryScreen from '../screens/pos/SalesHistoryScreen';
import ReportsScreen from '../screens/ReportsScreen';

export type EmployeeStackParamList = {
  PosHome: undefined;
  Sales: undefined;
  SalesHistory: undefined;
  Reports: undefined;
};

const Stack = createStackNavigator<EmployeeStackParamList>();

export default function EmployeeNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="PosHome" component={PosHomeScreen} options={{ title: 'POS' }} />
      <Stack.Screen name="Sales" component={SalesScreen} options={{ title: 'Ventas' }} />
      <Stack.Screen name="SalesHistory" component={SalesHistoryScreen} options={{ title: 'Historial' }} />
      <Stack.Screen name="Reports" component={ReportsScreen} options={{ title: 'Reportes' }} />
    </Stack.Navigator>
  );
}
