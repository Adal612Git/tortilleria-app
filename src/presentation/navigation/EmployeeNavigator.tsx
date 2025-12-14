import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import SalesScreen from '../screens/employee/SalesScreen';
import PosHomeScreen from '../screens/pos/PosHomeScreen';
import SalesHistoryScreen from '../screens/pos/SalesHistoryScreen';
import CashCutScreen from '../screens/pos/CashCutScreen';

export type EmployeeStackParamList = {
  PosHome: undefined;
  Sales: undefined;
  SalesHistory: undefined;
  CashCut: undefined;
};

const Stack = createStackNavigator<EmployeeStackParamList>();

export default function EmployeeNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="PosHome" component={PosHomeScreen} options={{ title: 'POS' }} />
      <Stack.Screen name="Sales" component={SalesScreen} options={{ title: 'Ventas' }} />
      <Stack.Screen name="SalesHistory" component={SalesHistoryScreen} options={{ title: 'Historial' }} />
      <Stack.Screen name="CashCut" component={CashCutScreen} options={{ title: 'Corte de caja' }} />
    </Stack.Navigator>
  );
}
