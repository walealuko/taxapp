import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useAuth } from '../../contexts/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { TYPOGRAPHY } from '../../constants/typography';
import { AppCard } from '../../components/ui/AppCard';
import { StandardInput } from '../../components/ui/StandardInput';

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

import SubscriptionGuard from '../../components/SubscriptionGuard';

export default function EmployeesScreen() {
  const colors = useThemeColors();
  const { user } = useAuth();
  // ... (rest of state)

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [newEmp, setNewEmp] = useState({ name: '', tin: '', salary: '', bonuses: '', overtime: '', category: 'Staff' });

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
        bonuses: parseFloat(newEmp.bonuses || '0'),
        overtime: parseFloat(newEmp.overtime || '0'),
        category: newEmp.category,
      });

      if (error) throw error;
      setModalVisible(false);
      setNewEmp({ name: '', tin: '', salary: '', bonuses: '', overtime: '', category: 'Staff' });
      setEditingEmployee(null);
      await fetchEmployees();
    } catch (err: any) {
      Alert.alert('Error', 'Failed to add employee: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const updateEmployee = async () => {
    if (!editingEmployee) return;
    if (!newEmp.name || !newEmp.tin || !newEmp.salary) {
      Alert.alert('Required Fields', 'Please fill in name, TIN, and salary');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from('employees').update({
        name: newEmp.name,
        tin: newEmp.tin,
        basic_salary: parseFloat(newEmp.salary),
        bonuses: parseFloat(newEmp.bonuses || '0'),
        overtime: parseFloat(newEmp.overtime || '0'),
        category: newEmp.category,
      }).eq('id', editingEmployee.id);

      if (error) throw error;
      setModalVisible(false);
      setEditingEmployee(null);
      setNewEmp({ name: '', tin: '', salary: '', bonuses: '', overtime: '', category: 'Staff' });
      await fetchEmployees();
    } catch (err: any) {
      Alert.alert('Error', 'Update failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setNewEmp({
      name: emp.name,
      tin: emp.tin,
      salary: emp.basic_salary.toString(),
      bonuses: (emp.bonuses || 0).toString(),
      overtime: (emp.overtime || 0).toString(),
      category: emp.category,
    });
    setModalVisible(true);
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
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.outline }]}>
        <Text style={[styles.headerTitle, { color: colors.text, ...TYPOGRAPHY.heading }]}>Employee Management</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary, ...TYPOGRAPHY.caption }]}>
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
                <Text style={[styles.emptyText, { color: colors.textSecondary, ...TYPOGRAPHY.body }]}>No employees added yet.</Text>
              </View>
            }
            renderItem={({ item }) => (
              <AppCard variant="default" style={styles.empCard}>
                <View style={styles.empRow}>
                  <TouchableOpacity
                    style={styles.empInfo}
                    onPress={() => calculateForEmployee(item)}
                  >
                    <Text style={[styles.empName, { color: colors.primary, ...TYPOGRAPHY.body, fontWeight: '700' }]}>
                      {item.name}
                    </Text>
                    <Text style={[styles.empTin, { color: colors.textSecondary, ...TYPOGRAPHY.caption }]}>TIN: {item.tin}</Text>
                    <Text style={[styles.empSalary, { color: colors.text, ...TYPOGRAPHY.caption, fontWeight: '600' }]}>
                      Salary: ₦{item.basic_salary.toLocaleString()}
                    </Text>
                  </TouchableOpacity>
                  <View style={styles.empActions}>
                    <TouchableOpacity onPress={() => calculateForEmployee(item)} style={styles.actionBtn}>
                      <MaterialCommunityIcons name="calculator" size={22} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => startEdit(item)} style={styles.actionBtn}>
                      <MaterialCommunityIcons name="pencil-outline" size={22} color="#4B5563" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => deleteEmployee(item.id)} style={styles.actionBtn}>
                      <MaterialCommunityIcons name="trash-can-outline" size={22} color="#FF6B6B" />
                    </TouchableOpacity>
                  </View>
                </View>
              </AppCard>
            )}
          />
        </View>
      )}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text, ...TYPOGRAPHY.heading }]}>
              {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
            </Text>

            <StandardInput
              label="Full Name"
              icon="account"
              value={newEmp.name}
              onChangeText={(v) => setNewEmp({ ...newEmp, name: v })}
              placeholder="John Doe"
            />

            <StandardInput
              label="Tax Identification Number (TIN)"
              icon="numeric"
              value={newEmp.tin}
              onChangeText={(v) => setNewEmp({ ...newEmp, tin: v })}
              placeholder="12345678-0001"
            />

            <StandardInput
              label="Annual Basic Salary (₦)"
              icon="cash"
              value={newEmp.salary}
              onChangeText={(v) => setNewEmp({ ...newEmp, salary: v })}
              placeholder="0.00"
              keyboardType="numeric"
            />

            <StandardInput
              label="Annual Bonuses (₦)"
              icon="gift"
              value={newEmp.bonuses}
              onChangeText={(v) => setNewEmp({ ...newEmp, bonuses: v })}
              placeholder="0.00"
              keyboardType="numeric"
            />

            <StandardInput
              label="Annual Overtime (₦)"
              icon="clock-outline"
              value={newEmp.overtime}
              onChangeText={(v) => setNewEmp({ ...newEmp, overtime: v })}
              placeholder="0.00"
              keyboardType="numeric"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.btn, styles.btnCancel, { backgroundColor: colors.surfaceVariant }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={[styles.btnCancelText, { color: colors.textSecondary, ...TYPOGRAPHY.body }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, styles.btnSave, { backgroundColor: colors.primary }]}
                onPress={editingEmployee ? updateEmployee : addEmployee}
                disabled={saving}
              >
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={[styles.btnSaveText, { color: '#fff', ...TYPOGRAPHY.body, fontWeight: 'bold' }]}>{editingEmployee ? 'Update Employee' : 'Save Employee'}</Text>}
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
    alignItems: 'flex-start',
  },
  headerTitle: { fontWeight: 'bold' },
  headerSubtitle: { marginTop: 4 },
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
    marginBottom: 12,
  },
  empRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  empInfo: {
    flex: 1,
    paddingRight: 10
  },
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
  btnCancel: { },
  btnCancelText: { },
  btnSave: { alignItems: 'center', justifyContent: 'center' },
  btnSaveText: { color: '#fff' },
});
