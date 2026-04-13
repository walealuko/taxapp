import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  AsyncStorage,
  Image,
  KeyboardAvoidingView,
  Platform,
  Dimensions
} from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import axios from "axios";

const { width } = Dimensions.get("window");
// Update this to your Cyclic backend URL after deployment
// Example: https://your-app-name.cyclic.app/api
const API_URL = "https://your-taxapp.cyclic.app/api";
const Stack = createNativeStackNavigator();

// Colors
const COLORS = {
  primary: "#6C63FF",
  primaryDark: "#5A52D5",
  secondary: "#FF6B6B",
  success: "#4CAF50",
  warning: "#FFB74D",
  info: "#29B6F6",
  white: "#FFFFFF",
  light: "#F8F9FE",
  gray: "#9E9E9E",
  dark: "#2D3436",
  lightGray: "#E8E8E8",
  gradientStart: "#667EEA",
  gradientEnd: "#764BA2"
};

// Storage helpers
const storeToken = async (token) => await AsyncStorage.setItem("taxapp_token", token);
const getStoredToken = async () => {
  const token = await AsyncStorage.getItem("taxapp_token");
  if (!token) throw new Error("Not authenticated");
  return token;
};
const formatCurrency = (amount) =>
  `₦${parseFloat(amount).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Tax Types with more info
const TAX_TYPES = [
  { id: "paye", name: "PAYE", description: "Pay As You Earn", icon: "💼", color: "#FF6B6B", bg: "#FFF5F5" },
  { id: "vat", name: "VAT", description: "Value Added Tax", icon: "🧾", color: "#4CAF50", bg: "#F0FFF4" },
  { id: "wht", name: "WHT", description: "Withholding Tax", icon: "✂️", color: "#FFB74D", bg: "#FFF8E1" },
  { id: "cgt", name: "CGT", description: "Capital Gains", icon: "📈", color: "#29B6F6", bg: "#E1F5FE" }
];

// Tax Info for detail screens
const TAX_INFO = {
  paye: {
    title: "PAYE Tax",
    subtitle: "Pay As You Earn",
    description: "Calculate your income tax based on Nigeria's progressive tax brackets.",
    rates: "7% - 24% depending on income level"
  },
  vat: {
    title: "VAT",
    subtitle: "Value Added Tax",
    description: "Calculate VAT on goods and services at applicable rates.",
    rates: "Standard: 7.5% | Others: 10%, 20%"
  },
  wht: {
    title: "WHT",
    subtitle: "Withholding Tax",
    description: "Calculate withholding tax deductions on various income types.",
    rates: "5% - 15% depending on category"
  },
  cgt: {
    title: "CGT",
    subtitle: "Capital Gains Tax",
    description: "Calculate tax on profits from asset disposal.",
    rates: "10% on chargeable gains"
  }
};

// Tax Categories for WHT
const WHT_CATEGORIES = [
  { id: "contractor", name: "Contractor", rate: "5%", color: "#FF6B6B" },
  { id: "dividend", name: "Dividend", rate: "10%", color: "#4CAF50" },
  { id: "rent", name: "Rent", rate: "10%", color: "#FFB74D" },
  { id: "interest", name: "Interest", rate: "10%", color: "#29B6F6" },
  { id: "royalty", name: "Royalty", rate: "15%", color: "#9C27B0" }
];

// LOGIN SCREEN
function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [secureText, setSecureText] = useState(true);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Oops! 😅", "Please fill in all fields to continue");
      return;
    }
    setLoading(true);
    try {
      const r = await axios.post(`${API_URL}/auth/login`, { email, password });
      await storeToken(r.data.token);
      navigation.replace("Dashboard", { user: r.data.user });
    } catch (err) {
      Alert.alert("Login Failed 😔", err.response?.data?.error || "Please check your credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.authContainer}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.authWrapper}>
        <ScrollView contentContainerStyle={styles.authScroll} keyboardShouldPersistTaps="handled">
          <View style={styles.authHeader}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoEmoji}>🏛️</Text>
            </View>
            <Text style={styles.authTitle}>TaxApp</Text>
            <Text style={styles.authSubtitle}>Nigeria Tax Calculator</Text>
            <Text style={styles.authTagline}>Calculate your taxes with ease</Text>
          </View>

          <View style={styles.authCard}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>📧</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                placeholderTextColor="#B0B0B0"
              />
            </View>

            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                secureTextEntry={secureText}
                value={password}
                onChangeText={setPassword}
                placeholderTextColor="#B0B0B0"
              />
              <TouchableOpacity onPress={() => setSecureText(!secureText)} style={styles.eyeBtn}>
                <Text>{secureText ? "👁️" : "🙈"}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.authBtn} onPress={handleLogin} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.authBtnText}>Sign In</Text>
                  <Text style={styles.authBtnArrow}>→</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.authDivider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity onPress={() => navigation.navigate("Register")} style={styles.registerLink}>
              <Text style={styles.registerText}>Don't have an account?</Text>
              <Text style={styles.registerHighlight}>Create one</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// REGISTER SCREEN
function RegisterScreen({ navigation }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!firstName || !lastName || !email || !password) {
      Alert.alert("Oops! 😅", "Please fill in all fields");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Oops! 😅", "Passwords don't match. Try again!");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Oops! 😅", "Password should be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API_URL}/auth/register`, { firstName, lastName, email, password });
      Alert.alert("Success! 🎉", "Your account has been created. Let's login!", [
        { text: "OK", onPress: () => navigation.navigate("Login") }
      ]);
    } catch (err) {
      Alert.alert("Registration Failed 😔", err.response?.data?.error || "Please try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.authContainer}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.authWrapper}>
        <ScrollView contentContainerStyle={styles.authScroll} keyboardShouldPersistTaps="handled">
          <View style={styles.authHeader}>
            <Text style={styles.authTitle}>Create Account</Text>
            <Text style={styles.authSubtitle}>Join TaxApp today</Text>
          </View>

          <View style={styles.authCard}>
            <View style={styles.nameRow}>
              <View style={styles.nameField}>
                <Text style={styles.inputLabel}>First Name</Text>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputIcon}>👤</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="First name"
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholderTextColor="#B0B0B0"
                  />
                </View>
              </View>
              <View style={styles.nameField}>
                <Text style={styles.inputLabel}>Last Name</Text>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputIcon}>👤</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Last name"
                    value={lastName}
                    onChangeText={setLastName}
                    placeholderTextColor="#B0B0B0"
                  />
                </View>
              </View>
            </View>

            <Text style={styles.inputLabel}>Email Address</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>📧</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                placeholderTextColor="#B0B0B0"
              />
            </View>

            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                style={styles.input}
                placeholder="Create a password"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                placeholderTextColor="#B0B0B0"
              />
            </View>

            <Text style={styles.inputLabel}>Confirm Password</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>🔐</Text>
              <TextInput
                style={styles.input}
                placeholder="Confirm your password"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholderTextColor="#B0B0B0"
              />
            </View>

            <TouchableOpacity style={styles.authBtn} onPress={handleRegister} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.authBtnText}>Create Account</Text>
                  <Text style={styles.authBtnArrow}>→</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate("Login")} style={styles.registerLink}>
              <Text style={styles.registerText}>Already have an account?</Text>
              <Text style={styles.registerHighlight}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// DASHBOARD SCREEN
function DashboardScreen({ navigation, route }) {
  const { user } = route.params || {};

  const handleLogout = async () => {
    Alert.alert(
      "Goodbye! 👋",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Logout", style: "destructive", onPress: async () => {
          await AsyncStorage.removeItem("taxapp_token");
          navigation.replace("Login");
        }}
      ]
    );
  };

  return (
    <View style={styles.dashboardContainer}>
      <View style={styles.dashboardHeader}>
        <View>
          <Text style={styles.dashboardGreeting}>Hello, {user?.firstName || "Friend"}! 👋</Text>
          <Text style={styles.dashboardSubtext}>What would you like to calculate today?</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutBtnText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.dashboardContent} showsVerticalScrollIndicator={false}>
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeEmoji}>🧮</Text>
          <View style={styles.welcomeTextContainer}>
            <Text style={styles.welcomeTitle}>Tax Calculator</Text>
            <Text style={styles.welcomeDesc}>Select a tax type below to get started</Text>
          </View>
        </View>

        <View style={styles.taxGrid}>
          {TAX_TYPES.map((tax) => (
            <TouchableOpacity
              key={tax.id}
              style={[styles.taxCard, { backgroundColor: tax.bg }]}
              onPress={() => navigation.navigate(tax.name.toUpperCase())}
              activeOpacity={0.7}
            >
              <View style={[styles.taxIconContainer, { backgroundColor: tax.color + "20" }]}>
                <Text style={styles.taxIcon}>{tax.icon}</Text>
              </View>
              <Text style={[styles.taxName, { color: tax.color }]}>{tax.name}</Text>
              <Text style={styles.taxDesc}>{tax.description}</Text>
              <View style={[styles.taxArrow, { backgroundColor: tax.color }]}>
                <Text style={styles.taxArrowText}>→</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.summaryBtn}
          onPress={() => navigation.navigate("Summary")}
          activeOpacity={0.8}
        >
          <Text style={styles.summaryBtnEmoji}>📊</Text>
          <Text style={styles.summaryBtnText}>View Tax Summary</Text>
        </TouchableOpacity>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>💡 Did you know?</Text>
          <Text style={styles.infoText}>
            Nigeria uses a progressive tax system for PAYE, with rates ranging from 7% to 24% based on annual income.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

// TAX CALCULATOR SCREEN (Generic template for PAYE, VAT, WHT, CGT)
function TaxCalculatorScreen({ route, navigation }) {
  const { taxType } = route.params;
  const taxInfo = TAX_INFO[taxType];

  const [inputs, setInputs] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleCalculate = async () => {
    if (taxType === "paye" && !inputs.grossIncome) {
      Alert.alert("Oops! 😅", "Please enter your gross income");
      return;
    }
    if (taxType === "vat" && !inputs.revenue) {
      Alert.alert("Oops! 😅", "Please enter your revenue");
      return;
    }
    if (taxType === "wht" && !inputs.amount) {
      Alert.alert("Oops! 😅", "Please enter an amount");
      return;
    }
    if (taxType === "cgt" && !inputs.disposalProceeds) {
      Alert.alert("Oops! 😅", "Please enter disposal proceeds");
      return;
    }

    setLoading(true);
    try {
      const token = await getStoredToken();
      const payload = { ...inputs };
      if (taxType === "paye") {
        payload.grossIncome = parseFloat(inputs.grossIncome);
        payload.frequency = inputs.frequency || "annual";
      }
      if (taxType === "vat") {
        payload.revenue = parseFloat(inputs.revenue);
        payload.rate = parseFloat(inputs.rate || "0.075");
      }
      if (taxType === "wht") {
        payload.amount = parseFloat(inputs.amount);
        payload.category = inputs.category || "contractor";
      }
      if (taxType === "cgt") {
        payload.disposalProceeds = parseFloat(inputs.disposalProceeds);
        payload.costBase = parseFloat(inputs.costBase || 0);
        payload.expenses = parseFloat(inputs.expenses || 0);
      }

      const r = await axios.post(`${API_URL}/tax/${taxType}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setResult(r.data);
    } catch (err) {
      Alert.alert("Calculation Failed 😔", err.response?.data?.error || "Please try again");
    } finally {
      setLoading(false);
    }
  };

  const renderInputs = () => {
    switch (taxType) {
      case "paye":
        return (
          <>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>💰 Gross Income</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputPrefix}>₦</Text>
                <TextInput
                  style={styles.inputWithPrefix}
                  placeholder="0.00"
                  keyboardType="numeric"
                  value={inputs.grossIncome || ""}
                  onChangeText={(v) => setInputs({ ...inputs, grossIncome: v })}
                  placeholderTextColor="#B0B0B0"
                />
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>📅 Frequency</Text>
              <View style={styles.toggleContainer}>
                {["monthly", "annual"].map((f) => (
                  <TouchableOpacity
                    key={f}
                    style={[styles.toggleBtn, inputs.frequency === f && styles.toggleActive]}
                    onPress={() => setInputs({ ...inputs, frequency: f })}
                  >
                    <Text style={[styles.toggleText, inputs.frequency === f && styles.toggleTextActive]}>
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        );

      case "vat":
        return (
          <>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>💵 Revenue</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputPrefix}>₦</Text>
                <TextInput
                  style={styles.inputWithPrefix}
                  placeholder="0.00"
                  keyboardType="numeric"
                  value={inputs.revenue || ""}
                  onChangeText={(v) => setInputs({ ...inputs, revenue: v })}
                  placeholderTextColor="#B0B0B0"
                />
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>📊 VAT Rate</Text>
              <View style={styles.toggleContainer}>
                {["0.075", "0.10", "0.20"].map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.toggleBtn, inputs.rate === r && styles.toggleActive]}
                    onPress={() => setInputs({ ...inputs, rate: r })}
                  >
                    <Text style={[styles.toggleText, inputs.rate === r && styles.toggleTextActive]}>
                      {(parseFloat(r) * 100).toFixed(1)}%
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        );

      case "wht":
        return (
          <>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>💵 Amount</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputPrefix}>₦</Text>
                <TextInput
                  style={styles.inputWithPrefix}
                  placeholder="0.00"
                  keyboardType="numeric"
                  value={inputs.amount || ""}
                  onChangeText={(v) => setInputs({ ...inputs, amount: v })}
                  placeholderTextColor="#B0B0B0"
                />
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>📁 Category</Text>
              <View style={styles.categoryGrid}>
                {WHT_CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryBtn,
                      { borderColor: cat.color },
                      inputs.category === cat.id && { backgroundColor: cat.color }
                    ]}
                    onPress={() => setInputs({ ...inputs, category: cat.id })}
                  >
                    <Text style={[styles.categoryName, inputs.category === cat.id && styles.categoryNameActive]}>
                      {cat.name}
                    </Text>
                    <Text style={[styles.categoryRate, inputs.category === cat.id && styles.categoryRateActive]}>
                      {cat.rate}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        );

      case "cgt":
        return (
          <>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>💵 Disposal Proceeds</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputPrefix}>₦</Text>
                <TextInput
                  style={styles.inputWithPrefix}
                  placeholder="Amount realized"
                  keyboardType="numeric"
                  value={inputs.disposalProceeds || ""}
                  onChangeText={(v) => setInputs({ ...inputs, disposalProceeds: v })}
                  placeholderTextColor="#B0B0B0"
                />
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>🏷️ Cost Base</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputPrefix}>₦</Text>
                <TextInput
                  style={styles.inputWithPrefix}
                  placeholder="Original cost"
                  keyboardType="numeric"
                  value={inputs.costBase || ""}
                  onChangeText={(v) => setInputs({ ...inputs, costBase: v })}
                  placeholderTextColor="#B0B0B0"
                />
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>📋 Allowable Expenses</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputPrefix}>₦</Text>
                <TextInput
                  style={styles.inputWithPrefix}
                  placeholder="Selling expenses"
                  keyboardType="numeric"
                  value={inputs.expenses || ""}
                  onChangeText={(v) => setInputs({ ...inputs, expenses: v })}
                  placeholderTextColor="#B0B0B0"
                />
              </View>
            </View>
          </>
        );

      default:
        return null;
    }
  };

  const renderResults = () => {
    if (!result) return null;

    let rows = [];
    if (taxType === "paye") {
      rows = [
        { label: "Gross Income", value: formatCurrency(result.grossIncome) },
        { label: "Frequency", value: result.frequency },
        { label: "Annual Income", value: formatCurrency(result.annualIncome) },
        { label: "Annual Tax", value: formatCurrency(result.annualTax), highlight: true },
        { label: "Monthly Tax", value: formatCurrency(result.monthlyTax), highlight: true }
      ];
    } else if (taxType === "vat") {
      rows = [
        { label: "Revenue", value: formatCurrency(result.revenue) },
        { label: "VAT Rate", value: `${result.vatRate * 100}%` },
        { label: "VAT Amount", value: formatCurrency(result.vatAmount), highlight: true },
        { label: "Net Amount", value: formatCurrency(result.netAmount) }
      ];
    } else if (taxType === "wht") {
      rows = [
        { label: "Category", value: result.category },
        { label: "Gross Amount", value: formatCurrency(result.grossAmount) },
        { label: "WHT Rate", value: `${result.whtRate * 100}%` },
        { label: "Withholding Tax", value: formatCurrency(result.withholdingTax), highlight: true },
        { label: "Net Payment", value: formatCurrency(result.netPayment) }
      ];
    } else if (taxType === "cgt") {
      rows = [
        { label: "Disposal Proceeds", value: formatCurrency(result.disposalProceeds) },
        { label: "Cost Base", value: formatCurrency(result.costBase) },
        { label: "Allowable Expenses", value: formatCurrency(result.allowableExpenses) },
        { label: "Chargeable Gain", value: formatCurrency(result.chargeableGain) },
        { label: "CGT Rate", value: `${result.cgtRate * 100}%` },
        { label: "Capital Gains Tax", value: formatCurrency(result.capitalGainsTax), highlight: true }
      ];
    }

    return (
      <View style={styles.resultCard}>
        <View style={styles.resultHeader}>
          <Text style={styles.resultHeaderEmoji}>🎉</Text>
          <Text style={styles.resultHeaderText}>Calculation Complete!</Text>
        </View>
        {rows.map((row, i) => (
          <View key={i} style={[styles.resultRow, row.highlight && styles.resultRowHighlight]}>
            <Text style={styles.resultLabel}>{row.label}</Text>
            <Text style={[styles.resultValue, row.highlight && styles.resultValueHighlight]}>
              {row.value}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.calculatorContainer}>
      <ScrollView style={styles.calculatorContent} showsVerticalScrollIndicator={false}>
        <View style={styles.calculatorInfo}>
          <Text style={styles.calculatorTitle}>{taxInfo.title}</Text>
          <Text style={styles.calculatorSubtitle}>{taxInfo.description}</Text>
          <View style={styles.rateBadge}>
            <Text style={styles.rateBadgeText}>📈 {taxInfo.rates}</Text>
          </View>
        </View>

        <View style={styles.calculatorCard}>
          {renderInputs()}

          <TouchableOpacity
            style={[styles.calcBtn, loading && styles.calcBtnDisabled]}
            onPress={handleCalculate}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.calcBtnText}>Calculate</Text>
                <Text style={styles.calcBtnIcon}>🧮</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {renderResults()}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

// PAYE SCREEN wrapper
function PAYEScreen({ navigation }) {
  return <TaxCalculatorScreen route={{ params: { taxType: "paye" } }} navigation={navigation} />;
}
function VATScreen({ navigation }) {
  return <TaxCalculatorScreen route={{ params: { taxType: "vat" } }} navigation={navigation} />;
}
function WHTScreen({ navigation }) {
  return <TaxCalculatorScreen route={{ params: { taxType: "wht" } }} navigation={navigation} />;
}
function CGTScreen({ navigation }) {
  return <TaxCalculatorScreen route={{ params: { taxType: "cgt" } }} navigation={navigation} />;
}

// SUMMARY SCREEN
function SummaryScreen({ navigation }) {
  const [grossIncome, setGrossIncome] = useState("");
  const [revenue, setRevenue] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const getSummary = async () => {
    if (!grossIncome && !revenue) {
      Alert.alert("Oops! 😅", "Please enter at least one value");
      return;
    }
    setLoading(true);
    try {
      const token = await getStoredToken();
      const r = await axios.post(
        `${API_URL}/tax/summary`,
        { grossIncome: parseFloat(grossIncome) || 0, revenue: parseFloat(revenue) || 0 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResult(r.data);
    } catch (err) {
      Alert.alert("Error 😔", err.response?.data?.error || "Summary failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.calculatorContainer}>
      <ScrollView style={styles.calculatorContent} showsVerticalScrollIndicator={false}>
        <View style={styles.calculatorInfo}>
          <Text style={styles.calculatorTitle}>📊 Tax Summary</Text>
          <Text style={styles.calculatorSubtitle}>Get an overview of your estimated tax liabilities</Text>
        </View>

        <View style={styles.calculatorCard}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>💼 Annual Gross Income (PAYE)</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputPrefix}>₦</Text>
              <TextInput
                style={styles.inputWithPrefix}
                placeholder="0.00"
                keyboardType="numeric"
                value={grossIncome}
                onChangeText={setGrossIncome}
                placeholderTextColor="#B0B0B0"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>💰 Annual Revenue (VAT)</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputPrefix}>₦</Text>
              <TextInput
                style={styles.inputWithPrefix}
                placeholder="0.00"
                keyboardType="numeric"
                value={revenue}
                onChangeText={setRevenue}
                placeholderTextColor="#B0B0B0"
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.calcBtn, loading && styles.calcBtnDisabled]}
            onPress={getSummary}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.calcBtnText}>Get Summary</Text>
                <Text style={styles.calcBtnIcon}>📊</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {result && (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultHeaderEmoji}>📋</Text>
              <Text style={styles.resultHeaderText}>Your Tax Breakdown</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>PAYE Tax</Text>
              <Text style={styles.resultValue}>{formatCurrency(result.breakdown?.paye || 0)}</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>VAT</Text>
              <Text style={styles.resultValue}>{formatCurrency(result.breakdown?.vat || 0)}</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Withholding Tax</Text>
              <Text style={styles.resultValue}>{formatCurrency(result.breakdown?.wht || 0)}</Text>
            </View>
            <View style={[styles.resultRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total Estimated Tax</Text>
              <Text style={styles.totalValue}>{formatCurrency(result.totalEstimatedTax)}</Text>
            </View>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

// STYLES
const styles = StyleSheet.create({
  // Auth Styles
  authContainer: { flex: 1, backgroundColor: COLORS.primary },
  authWrapper: { flex: 1 },
  authScroll: { flexGrow: 1, justifyContent: "center", padding: 24 },
  authHeader: { alignItems: "center", marginBottom: 32 },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16
  },
  logoEmoji: { fontSize: 40 },
  authTitle: { fontSize: 36, fontWeight: "bold", color: "#fff", marginBottom: 4 },
  authSubtitle: { fontSize: 16, color: "rgba(255,255,255,0.8)" },
  authTagline: { fontSize: 14, color: "rgba(255,255,255,0.6)", marginTop: 8 },
  authCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10
  },
  authBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 18,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8
  },
  authBtnText: { color: "#fff", fontSize: 18, fontWeight: "600" },
  authBtnArrow: { color: "#fff", fontSize: 18, marginLeft: 8 },
  authDivider: { flexDirection: "row", alignItems: "center", marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.lightGray },
  dividerText: { marginHorizontal: 12, color: COLORS.gray, fontSize: 12 },
  registerLink: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
  registerText: { color: COLORS.gray, fontSize: 14 },
  registerHighlight: { color: COLORS.primary, fontSize: 14, fontWeight: "600", marginLeft: 4 },

  // Input Styles
  inputLabel: { fontSize: 14, color: COLORS.dark, fontWeight: "500", marginBottom: 8 },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.light,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    paddingHorizontal: 12
  },
  inputIcon: { fontSize: 16, marginRight: 8 },
  input: { flex: 1, paddingVertical: 14, fontSize: 16, color: COLORS.dark },
  inputWithPrefix: { flex: 1, paddingVertical: 14, fontSize: 16, color: COLORS.dark },
  inputPrefix: { fontSize: 16, color: COLORS.gray },
  inputGroup: { marginBottom: 16 },
  eyeBtn: { padding: 8 },

  // Dashboard Styles
  dashboardContainer: { flex: 1, backgroundColor: COLORS.light },
  dashboardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: Platform.OS === "ios" ? 50 : 50,
    backgroundColor: COLORS.primary
  },
  dashboardGreeting: { fontSize: 22, fontWeight: "bold", color: "#fff" },
  dashboardSubtext: { fontSize: 14, color: "rgba(255,255,255,0.8)", marginTop: 4 },
  logoutBtn: { padding: 8 },
  logoutBtnText: { color: "#fff", fontSize: 14 },
  dashboardContent: { flex: 1, padding: 16 },
  welcomeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2
  },
  welcomeEmoji: { fontSize: 40, marginRight: 16 },
  welcomeTitle: { fontSize: 18, fontWeight: "bold", color: COLORS.dark },
  welcomeDesc: { fontSize: 13, color: COLORS.gray, marginTop: 2 },
  taxGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  taxCard: {
    width: "48%",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2
  },
  taxIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12
  },
  taxIcon: { fontSize: 24 },
  taxName: { fontSize: 18, fontWeight: "bold", marginBottom: 2 },
  taxDesc: { fontSize: 12, color: COLORS.gray },
  taxArrow: {
    position: "absolute",
    right: 12,
    bottom: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center"
  },
  taxArrowText: { color: "#fff", fontSize: 12 },
  summaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.success,
    borderRadius: 16,
    padding: 18,
    marginTop: 8
  },
  summaryBtnEmoji: { fontSize: 20, marginRight: 8 },
  summaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  infoCard: {
    backgroundColor: "#FFF9E6",
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning
  },
  infoTitle: { fontSize: 14, fontWeight: "600", color: COLORS.dark, marginBottom: 4 },
  infoText: { fontSize: 13, color: COLORS.gray, lineHeight: 20 },

  // Calculator Styles
  calculatorContainer: { flex: 1, backgroundColor: COLORS.light },
  calculatorContent: { flex: 1 },
  calculatorInfo: { padding: 20, paddingTop: Platform.OS === "ios" ? 50 : 50, backgroundColor: COLORS.primary },
  calculatorTitle: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  calculatorSubtitle: { fontSize: 14, color: "rgba(255,255,255,0.8)", marginTop: 4 },
  rateBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginTop: 12
  },
  rateBadgeText: { color: "#fff", fontSize: 12, fontWeight: "500" },
  calculatorCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    margin: 16,
    marginTop: -20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10
  },
  toggleContainer: { flexDirection: "row", backgroundColor: COLORS.light, borderRadius: 12, padding: 4 },
  toggleBtn: { flex: 1, paddingVertical: 12, alignItems: "center", borderRadius: 10 },
  toggleActive: { backgroundColor: COLORS.primary },
  toggleText: { fontSize: 14, fontWeight: "500", color: COLORS.gray },
  toggleTextActive: { color: "#fff" },
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", marginTop: 4 },
  categoryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 10,
    marginRight: 8,
    marginBottom: 8
  },
  categoryName: { fontSize: 13, color: COLORS.dark },
  categoryNameActive: { color: "#fff", fontWeight: "500" },
  categoryRate: { fontSize: 11, color: COLORS.gray, marginLeft: 6 },
  categoryRateActive: { color: "rgba(255,255,255,0.8)" },
  calcBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 18,
    marginTop: 8
  },
  calcBtnDisabled: { backgroundColor: COLORS.gray },
  calcBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  calcBtnIcon: { fontSize: 18, marginLeft: 8 },

  // Result Styles
  resultCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    margin: 16,
    marginTop: 0,
    shadowColor: COLORS.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#E8F5E9"
  },
  resultHeader: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  resultHeaderEmoji: { fontSize: 24, marginRight: 8 },
  resultHeaderText: { fontSize: 18, fontWeight: "bold", color: COLORS.dark },
  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.light
  },
  resultRowHighlight: { backgroundColor: "#F0FFF4", marginHorizontal: -12, paddingHorizontal: 12, borderRadius: 8, borderBottomWidth: 0 },
  resultLabel: { fontSize: 14, color: COLORS.gray },
  resultValue: { fontSize: 14, fontWeight: "600", color: COLORS.dark },
  resultValueHighlight: { fontSize: 18, color: COLORS.success, fontWeight: "bold" },
  totalRow: { borderBottomWidth: 0, marginTop: 8, backgroundColor: "#E8F5E9", marginHorizontal: -12, paddingHorizontal: 12, borderRadius: 10 },
  totalLabel: { fontSize: 16, fontWeight: "bold", color: COLORS.dark },
  totalValue: { fontSize: 20, fontWeight: "bold", color: COLORS.success },
  bottomPadding: { height: 40 },

  // Name row
  nameRow: { flexDirection: "row", justifyContent: "space-between" },
  nameField: { width: "48%" }
});

// MAIN APP
export default function App() {
  return (
    <NavigationContainer>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerStyle: { backgroundColor: COLORS.primary },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "600" },
          headerShadowVisible: false
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ headerShown: false }} />
        <Stack.Screen name="PAYE" component={PAYEScreen} options={{ title: "PAYE Tax", headerShown: false }} />
        <Stack.Screen name="VAT" component={VATScreen} options={{ title: "VAT Calculation", headerShown: false }} />
        <Stack.Screen name="WHT" component={WHTScreen} options={{ title: "Withholding Tax", headerShown: false }} />
        <Stack.Screen name="CGT" component={CGTScreen} options={{ title: "Capital Gains Tax", headerShown: false }} />
        <Stack.Screen name="Summary" component={SummaryScreen} options={{ title: "Tax Summary", headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
