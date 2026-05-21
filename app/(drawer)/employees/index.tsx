import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { supabase } from '../../../lib/supabase';
import { useThemeColors } from '../../../hooks/useThemeColors';
import { useAuth } from '../../../contexts/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

interface Employee {
  id: string;
  name: string;
  tin: string;
  basic_salary: number;
  category: string;
  created_at: string;
}

export default function EmployeesScreen() {
  const colors = useThemeColors();
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newEmp, setNewEmp] = useState({ name: '', tin: '', salary: '', category: 'Staff' });

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('user_id', user?.id)
        .order('name', { ascending: true });

      if (error) throw error;
      setEmployees(data || []);
    } catch (err: any) {
      Alert.alert('Error', 'Failed to load employees: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [user]);

  const addEmployee = async () => {
    if (!newEmp.name || !newEmp.tin || !newEmp.salary) {
      Alert.alert('Required Fields', 'Please fill in name, TIN, and salary');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from('employees').insert({
        user_id: user?.id,
        name: newEmp.name,
        tin: newEmp.tin,
        basic_salary: parseFloat(newEmp.salary),
        category: newEmp.category,
      });

      if (error) throw error;
      setModalVisible(false);
      setNewEmp({ name: '', tin: '', salary: '', category: 'Staff' });
      await fetchEmployees();
    } catch (err: any) {
      Alert.alert('Error', 'Failed to add employee: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteEmployee = async (id: string) => {
    Alert.alert('Delete Employee', 'Are you sure you want to remove this employee?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase.from('employees').delete().eq('id', id);
            if (error) throw error;
            await fetchEmployees();
          } catch (err: any) {
            Alert.alert('Error', 'Delete failed: ' + err.message);
          }
        },
      },
    ]);
  };

  const calculateForEmployee = (emp: Employee) => {
    router.push({
      pathname: '/tax',
      params: {
        type: 'paye',
        basicSalary: emp.basic_salary,
        employeeName: emp.name
      },
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Employee Management</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          Manage your staff payroll and tax profiles
        </Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <View style={styles.content}>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
            onPress={() => setModalVisible(true)}
          >
            <MaterialCommunityIcons name="plus" size={24} color="#fff" />
            <Text style={styles.addBtnText}>Add Employee</Text>
          </TouchableOpacity>

          <FlatList
            data={employees}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="account-group-outline" size={64} color={colors.textSecondary} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No employees added yet.</Text>
              </View>
            }
            renderItem={({ item }) => (
              <View style={[styles.empCard, { backgroundColor: colors.surface }]}>
                <View style={styles.empInfo}>
                  <Text style={[styles.empName, { color: colors.text }]}>{item.name}</Text>
                  <Text style={[styles.empTin, { color: colors.textSecondary }]}>TIN: {item.tin}</Text>
                  <Text style={[styles.empSalary, { color: colors.primary }]}>₦{item.basic_salary.toLocaleString()}</Text>
                </View>
                <View style={styles.empActions}>
                  <TouchableOpacity onPress={() => calculateForEmployee(item)} style={styles.actionBtn}>
                    <MaterialCommunityIcons name="calculator" size={22} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteEmployee(item.id)} style={styles.actionBtn}>
                    <MaterialCommunityIcons name="trash-can-outline" size={22} color="#FF6B6B" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        </View>
      )}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add New Employee</Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Full Name</Text>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                placeholder="John Doe"
                value={newEmp.name}
                onChangeText={(v) => setNewEmp({ ...newEmp, name: v })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Tax Identification Number (TIN)</Text>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                placeholder="12345678-0001"
                value={newEmp.tin}
                onChangeText={(v) => setNewEmp({ ...newEmp, tin: v })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Annual Basic Salary (₦)</Text>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                placeholder="0.00"
                keyboardType="numeric"
                value={newEmp.salary}
                onChangeText={(v) => setNewEmp({ ...newEmp, salary: v })}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.btn, styles.btnCancel]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.btnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, styles.btnSave, { backgroundColor: colors.primary }]}
                onPress={addEmployee}
                disabled={saving}
              >
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnSaveText}>Save Employee</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'flex-start',
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold' },
  headerSubtitle: { fontSize: 14, marginTop: 4 },
  content: { flex: 1, padding: 16 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
  },
  addBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  listContent: { paddingBottom: 20 },
  empCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
    elevation: 2,
  },
  empInfo: { flex: 1 },
  empName: { fontSize: 16, fontWeight: 'bold' },
  empTin: { fontSize: 13, marginTop: 2 },
  empSalary: { fontSize: 14, fontWeight: '600', marginTop: 4 },
  empActions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f0f4ff',
  },
  emptyState: { alignItems: 'center', marginTop: 40, padding: 20 },
  emptyText: { fontSize: 15, textAlign: 'center', marginTop: 12 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    borderRadius: 20,
    padding: 24,
    elevation: 5,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 6 },
  input: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 24,
  },
  btn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    fontSize: 14,
    fontWeight: '600',
  },
  btnCancel: { backgroundColor: '#eee' },
  btnCancelText: { color: '#666' },
  btnSave: { alignItems: 'center', justifyContent: 'center' },
  btnSaveText: { color: '#fff' },
});
