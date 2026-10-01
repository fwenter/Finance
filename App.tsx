import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

// --- Types ---
type RecurringExpense = {
  id: string;
  name: string;
  amount: number;
};

type Category = {
  id: string;
  name: string;
};

type VariableExpense = {
  id: string;
  categoryId: string;
  name: string;
  amount: number;
  date: string;
};

type AppData = {
  income: number;
  recurringExpenses: RecurringExpense[];
  categories: Category[];
  variableExpenses: VariableExpense[];
};

const DEFAULT_DATA: AppData = {
  income: 0,
  recurringExpenses: [],
  categories: [{ id: 'cat-1', name: 'General' }],
  variableExpenses: [],
};

// --- Main App Component ---
export default function App() {
  const [data, setData] = useState<AppData>(DEFAULT_DATA);
  const [loading, setLoading] = useState(true);
  
  // UI States
  const [activeTab, setActiveTab] = useState<'dashboard' | 'recurring' | 'variable'>('dashboard');
  
  // Inputs
  const [incomeInput, setIncomeInput] = useState('');
  const [newRecName, setNewRecName] = useState('');
  const [newRecAmount, setNewRecAmount] = useState('');
  
  const [newCatName, setNewCatName] = useState('');
  const [selectedCat, setSelectedCat] = useState<string>('');
  
  const [newVarName, setNewVarName] = useState('');
  const [newVarAmount, setNewVarAmount] = useState('');

  // Load Data
  useEffect(() => {
    const loadData = async () => {
      try {
        const stored = await AsyncStorage.getItem('@finance_data');
        if (stored) {
          const parsed = JSON.parse(stored);
          setData(parsed);
          if (parsed.categories.length > 0) {
            setSelectedCat(parsed.categories[0].id);
          }
        } else {
          setSelectedCat('cat-1');
        }
      } catch (e) {
        console.error('Failed to load data', e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Save Data
  const saveData = async (newData: AppData) => {
    try {
      setData(newData);
      await AsyncStorage.setItem('@finance_data', JSON.stringify(newData));
    } catch (e) {
      console.error('Failed to save data', e);
    }
  };

  // --- Handlers ---
  const updateIncome = () => {
    const val = parseFloat(incomeInput.replace(',', '.'));
    if (!isNaN(val)) {
      saveData({ ...data, income: val });
      setIncomeInput('');
      Alert.alert('Success', 'Monthly income updated!');
    }
  };

  const addRecurring = () => {
    const val = parseFloat(newRecAmount.replace(',', '.'));
    if (newRecName.trim() === '' || isNaN(val)) {
      Alert.alert('Error', 'Please enter a valid name and amount.');
      return;
    }
    const newExpense: RecurringExpense = {
      id: Date.now().toString(),
      name: newRecName,
      amount: val
    };
    saveData({ ...data, recurringExpenses: [...data.recurringExpenses, newExpense] });
    setNewRecName('');
    setNewRecAmount('');
  };

  const deleteRecurring = (id: string) => {
    saveData({
      ...data,
      recurringExpenses: data.recurringExpenses.filter(e => e.id !== id)
    });
  };

  const addCategory = () => {
    if (newCatName.trim() === '') return;
    const newCat: Category = {
      id: 'cat-' + Date.now().toString(),
      name: newCatName
    };
    saveData({ ...data, categories: [...data.categories, newCat] });
    setSelectedCat(newCat.id);
    setNewCatName('');
  };

  const addVariableExpense = () => {
    const val = parseFloat(newVarAmount.replace(',', '.'));
    if (newVarName.trim() === '' || isNaN(val) || !selectedCat) {
      Alert.alert('Error', 'Please enter a valid name, amount, and select a category.');
      return;
    }
    const newExpense: VariableExpense = {
      id: Date.now().toString(),
      categoryId: selectedCat,
      name: newVarName,
      amount: val,
      date: new Date().toISOString()
    };
    saveData({ ...data, variableExpenses: [...data.variableExpenses, newExpense] });
    setNewVarName('');
    setNewVarAmount('');
  };

  const deleteVariable = (id: string) => {
    saveData({
      ...data,
      variableExpenses: data.variableExpenses.filter(e => e.id !== id)
    });
  };

  // --- Calculations ---
  const totalRecurring = data.recurringExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  const totalVariable = data.variableExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpenses = totalRecurring + totalVariable;
  const balance = data.income - totalExpenses;

  if (loading) return <View style={styles.center}><Text>Loading...</Text></View>;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Finance Tracker</Text>
          <Text style={styles.headerSubtitle}>Manage your monthly budget</Text>
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Net Balance</Text>
          <Text style={[styles.balanceAmount, { color: balance >= 0 ? '#4ade80' : '#f87171' }]}>
            € {balance.toFixed(2)}
          </Text>
          <View style={styles.balanceRow}>
            <View>
              <Text style={styles.balanceSubLabel}>Income</Text>
              <Text style={styles.balanceSubAmount}>€ {data.income.toFixed(2)}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.balanceSubLabel}>Expenses</Text>
              <Text style={styles.balanceSubAmount}>€ {totalExpenses.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'dashboard' && styles.activeTab]}
            onPress={() => setActiveTab('dashboard')}
          >
            <Text style={[styles.tabText, activeTab === 'dashboard' && styles.activeTabText]}>Overview</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'recurring' && styles.activeTab]}
            onPress={() => setActiveTab('recurring')}
          >
            <Text style={[styles.tabText, activeTab === 'recurring' && styles.activeTabText]}>Recurring</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'variable' && styles.activeTab]}
            onPress={() => setActiveTab('variable')}
          >
            <Text style={[styles.tabText, activeTab === 'variable' && styles.activeTabText]}>Variable</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          
          {/* OVERVIEW TAB */}
          {activeTab === 'dashboard' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Set Monthly Income</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 2500"
                  placeholderTextColor="#64748b"
                  keyboardType="numeric"
                  value={incomeInput}
                  onChangeText={setIncomeInput}
                />
                <TouchableOpacity style={styles.btnPrimary} onPress={updateIncome}>
                  <Text style={styles.btnText}>Update</Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Expenses Summary</Text>
              <View style={styles.card}>
                <View style={styles.summaryRow}>
                  <Text style={styles.textLight}>Recurring Expenses</Text>
                  <Text style={styles.textBold}>€ {totalRecurring.toFixed(2)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.textLight}>Variable Expenses</Text>
                  <Text style={styles.textBold}>€ {totalVariable.toFixed(2)}</Text>
                </View>
              </View>
            </View>
          )}

          {/* RECURRING TAB */}
          {activeTab === 'recurring' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Add Recurring Expense</Text>
              <View style={styles.formCard}>
                <TextInput
                  style={styles.inputFull}
                  placeholder="Name (e.g. Rent, Netflix)"
                  placeholderTextColor="#64748b"
                  value={newRecName}
                  onChangeText={setNewRecName}
                />
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.input}
                    placeholder="Amount (€)"
                    placeholderTextColor="#64748b"
                    keyboardType="numeric"
                    value={newRecAmount}
                    onChangeText={setNewRecAmount}
                  />
                  <TouchableOpacity style={styles.btnPrimary} onPress={addRecurring}>
                    <Text style={styles.btnText}>Add</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Monthly Recurring</Text>
              {data.recurringExpenses.length === 0 ? (
                <Text style={styles.emptyText}>No recurring expenses yet.</Text>
              ) : (
                data.recurringExpenses.map(exp => (
                  <View key={exp.id} style={styles.listItem}>
                    <Text style={styles.listName}>{exp.name}</Text>
                    <View style={styles.listRight}>
                      <Text style={styles.listAmount}>€ {exp.amount.toFixed(2)}</Text>
                      <TouchableOpacity onPress={() => deleteRecurring(exp.id)}>
                        <Ionicons name="trash-outline" size={20} color="#f87171" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}

          {/* VARIABLE TAB */}
          {activeTab === 'variable' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Add Category</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  placeholder="New Category Name"
                  placeholderTextColor="#64748b"
                  value={newCatName}
                  onChangeText={setNewCatName}
                />
                <TouchableOpacity style={styles.btnSecondary} onPress={addCategory}>
                  <Text style={styles.btnText}>Add</Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Add Variable Expense</Text>
              <View style={styles.formCard}>
                
                {/* Category Selector */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
                  {data.categories.map(cat => (
                    <TouchableOpacity 
                      key={cat.id} 
                      style={[styles.catBadge, selectedCat === cat.id && styles.catBadgeActive]}
                      onPress={() => setSelectedCat(cat.id)}
                    >
                      <Text style={[styles.catBadgeText, selectedCat === cat.id && styles.catBadgeTextActive]}>
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <TextInput
                  style={styles.inputFull}
                  placeholder="Expense Name (e.g. Groceries)"
                  placeholderTextColor="#64748b"
                  value={newVarName}
                  onChangeText={setNewVarName}
                />
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.input}
                    placeholder="Amount (€)"
                    placeholderTextColor="#64748b"
                    keyboardType="numeric"
                    value={newVarAmount}
                    onChangeText={setNewVarAmount}
                  />
                  <TouchableOpacity style={styles.btnPrimary} onPress={addVariableExpense}>
                    <Text style={styles.btnText}>Add</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Variable Expenses</Text>
              {data.variableExpenses.length === 0 ? (
                <Text style={styles.emptyText}>No variable expenses yet.</Text>
              ) : (
                data.variableExpenses
                  .slice()
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map(exp => {
                    const catName = data.categories.find(c => c.id === exp.categoryId)?.name || 'Unknown';
                    return (
                      <View key={exp.id} style={styles.listItem}>
                        <View>
                          <Text style={styles.listName}>{exp.name}</Text>
                          <Text style={styles.listCatBadge}>{catName}</Text>
                        </View>
                        <View style={styles.listRight}>
                          <Text style={styles.listAmount}>€ {exp.amount.toFixed(2)}</Text>
                          <TouchableOpacity onPress={() => deleteVariable(exp.id)}>
                            <Ionicons name="trash-outline" size={20} color="#f87171" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                })
              )}
            </View>
          )}
          
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  center: {
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#0f172a'
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 15,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
  balanceCard: {
    marginHorizontal: 20,
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  balanceLabel: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  balanceSubLabel: {
    color: '#64748b',
    fontSize: 12,
  },
  balanceSubAmount: {
    color: '#e2e8f0',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#3b82f6',
  },
  tabText: {
    color: '#94a3b8',
    fontWeight: '600',
    fontSize: 14,
  },
  activeTabText: {
    color: '#ffffff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  formCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  textLight: {
    color: '#cbd5e1',
    fontSize: 15,
  },
  textBold: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    paddingHorizontal: 15,
    color: '#ffffff',
    height: 48,
  },
  inputFull: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    paddingHorizontal: 15,
    color: '#ffffff',
    height: 48,
  },
  btnPrimary: {
    backgroundColor: '#3b82f6',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: 48,
  },
  btnSecondary: {
    backgroundColor: '#8b5cf6',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: 48,
  },
  btnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  listName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  listCatBadge: {
    color: '#8b5cf6',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  listRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  listAmount: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyText: {
    color: '#64748b',
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
  },
  catScroll: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  catBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    marginRight: 8,
  },
  catBadgeActive: {
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6',
  },
  catBadgeText: {
    color: '#94a3b8',
    fontWeight: '600',
    fontSize: 13,
  },
  catBadgeTextActive: {
    color: '#ffffff',
  }
});
