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
  const [employees, setEmployees] = useState<Employee[]>([]); // Initialize as an empty array of Employee objects

  const handleAddEmployee = () => {
    if (employeeName.trim() === '') {
      alert('Please enter a valid employee name.');
    } else {
      const newEmployee: Employee = {
        id: Math.random().toString(36).substring(2, 15), // Generate a random ID
        name: employeeName,
        tin: 'TBD',
        basic_salary: 0,
        category: 'Uncategorized'
      };

      setEmployees([...employees, newEmployee]); // Add the new employee to the state array
      setEmployeeName(''); // Clear the input field
      alert(`Employee ${newEmployee.name} added successfully!`);
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

      <Text style={styles.employeeList}>Employees:</Text>
      {employees.map((employee) => (
        <Text key={employee.id}>{employee.name}</Text>
      ))}
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
  employeeList: {
    fontSize: 16,
    marginTop: 20,
  }
});

export default Employees;
