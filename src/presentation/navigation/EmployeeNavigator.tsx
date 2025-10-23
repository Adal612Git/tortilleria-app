import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import SalesScreen from '../screens/employee/SalesScreen';

export type EmployeeStackParamList = {
  Sales: undefined;
};

const Stack = createStackNavigator<EmployeeStackParamList>();

export default function EmployeeNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Sales" component={SalesScreen} options={{ title: 'Ventas' }} />
    </Stack.Navigator>
  );
}

