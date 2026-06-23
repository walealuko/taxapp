import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';

interface Employee {
  id: string;
  name: string;
  tin: string;
  basic_salary: number;
  bonuses?: number;
  overtime?: number;
  category: string;
  created_at: string;
}

const Employees = () => {
  const [employeeName, setEmployeeName] = useState('');

  const handleAddEmployee = () => {
    // Simulate adding an employee to a list (replace with actual logic)
    if (employeeName) {
      console.log('New Employee Added:', employeeName);
      setEmployeeName(''); // Clear the input field
    } else {
      alert('Please enter an employee name.');
    }
  };

  return (
    <View style={styles.container}>
      <Text>Employees List</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter Employee Name"
        value={employeeName}
        onChangeText={text => setEmployeeName(text)}
      />
      <Button title="Add Employee" onPress={handleAddEmployee} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 8,
  },
});

export default Employees;
