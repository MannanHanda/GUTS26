import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
} from 'react-native';
import { 
  DEFAULT_STUDENT_PROFILE, 
  MOCK_ACCOMMODATIONS, 
  MOCK_BANK_ACCOUNTS, 
  MOCK_TRANSPORTS,
  MOCK_HEALTHCARE_BENEFITS,
  MOCK_HEALTHCARE_CLINICS,
} from './src/shared/mock-data/glasgow-dataset';
import { 
  DecisionCombination, 
  StudentProfile, 
  AccommodationListing, 
  BankAccount, 
  TransportOption,
  HealthcareBenefit,
  HealthcareClinic,
} from './src/shared/types';
import { apiClient } from './src/shared/api-client';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'housing' | 'transit' | 'banking' | 'healthcare'>('dashboard');
  const [profile, setProfile] = useState<StudentProfile>(DEFAULT_STUDENT_PROFILE);
  const [combinations, setCombinations] = useState<DecisionCombination[]>([]);
  const [selectedComboId, setSelectedComboId] = useState<string>('');
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);

  useEffect(() => {
    apiClient.getRecommendations(profile).then((res) => {
      if (res.data && res.data.length > 0) {
        setCombinations(res.data);
        setSelectedComboId(res.data[0].id);
      }
    });
  }, [profile]);

  const activeCombo = combinations.find((c) => c.id === selectedComboId) || combinations[0];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Mobile Top Navigation Header */}
      <View style={styles.header}>
        <View>
          <View style={styles.brandRow}>
            <View style={styles.brandBadge}>
              <Text style={styles.brandBadgeText}>£</Text>
            </View>
            <Text style={styles.headerTitle}>The Hidden Cost</Text>
          </View>
          <Text style={styles.headerSubtitle}>
            {profile.university} • £{profile.totalBudget}/wk budget
          </Text>
        </View>

        <TouchableOpacity 
          style={styles.profileButton}
          onPress={() => setShowProfileModal(true)}
        >
          <Text style={styles.profileButtonText}>Adjust Budget</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Selector */}
      <View style={styles.tabBar}>
        {[
          { id: 'dashboard', label: 'True Cost' },
          { id: 'housing', label: 'Housing' },
          { id: 'transit', label: 'Transit' },
          { id: 'banking', label: 'Banking' },
          { id: 'healthcare', label: 'Health' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.id}
            onPress={() => setActiveTab(tab.id as any)}
            style={[styles.tabItem, activeTab === tab.id && styles.activeTabItem]}
          >
            <Text style={[styles.tabLabel, activeTab === tab.id && styles.activeTabLabel]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* TAB 1: TRUE COST DASHBOARD */}
        {activeTab === 'dashboard' && activeCombo && (
          <View style={styles.section}>
            {/* Top True Cost Banner (Deep Slate Neutral) */}
            <View style={styles.metricCardPrimary}>
              <Text style={styles.metricLabel}>TRUE WEEKLY LIVING COST</Text>
              <Text style={styles.metricValueLarge}>
                £{Math.round(activeCombo.costSummary.weeklyNetLivingCost)}
                <Text style={styles.metricUnit}> / wk</Text>
              </Text>

              <View style={styles.metricRow}>
                <View style={styles.subMetric}>
                  <Text style={styles.subMetricLabel}>Monthly Est.</Text>
                  <Text style={styles.subMetricValue}>£{activeCombo.costSummary.monthlyNetLivingCost}</Text>
                </View>
                <View style={styles.subMetricDivider} />
                <View style={styles.subMetric}>
                  <Text style={styles.subMetricLabel}>Day-1 Move-in</Text>
                  <Text style={styles.subMetricValue}>£{activeCombo.costSummary.totalUpfrontCost}</Text>
                </View>
                <View style={styles.subMetricDivider} />
                <View style={styles.subMetric}>
                  <Text style={styles.subMetricLabel}>Commute</Text>
                  <Text style={styles.subMetricValue}>{activeCombo.costSummary.weeklyCommutingHours}h/wk</Text>
                </View>
              </View>

              <View style={styles.marginPill}>
                <Text style={styles.marginText}>
                  {activeCombo.costSummary.isUnderBudget
                    ? `✓ £${Math.round(activeCombo.costSummary.budgetDifferenceWeekly)}/wk under your target budget`
                    : `⚠️ £${Math.round(Math.abs(activeCombo.costSummary.budgetDifferenceWeekly))}/wk over target budget`}
                </Text>
              </View>
            </View>

            {/* AI Recommended Package */}
            <View style={styles.aiPackageCard}>
              <View style={styles.aiBadgeRow}>
                <View style={styles.aiBadge}>
                  <Text style={styles.aiBadgeText}>RECOMMENDED PACKAGE</Text>
                </View>
                <Text style={styles.scoreText}>{activeCombo.score}/100 Fit</Text>
              </View>

              <Text style={styles.aiTitle}>{activeCombo.accommodation.name}</Text>
              <Text style={styles.aiSubtitle}>
                {activeCombo.accommodation.area} • {activeCombo.transport.passName}
              </Text>

              <View style={styles.reasonBox}>
                <Text style={styles.reasonText}>
                  {activeCombo.recommendationReason}
                </Text>
              </View>

              {/* 3 Pillars */}
              <View style={styles.pillarsContainer}>
                <View style={styles.pillarItem}>
                  <Text style={styles.pillarHeader}>1. HOUSING CHOICE</Text>
                  <Text style={styles.pillarName}>{activeCombo.accommodation.name}</Text>
                  <Text style={styles.pillarDetail}>
                    Rent: £{activeCombo.accommodation.weeklyRent}/wk
                    {activeCombo.accommodation.billsIncluded ? ' (Bills included £0)' : ' (+Estimated bills)'}
                  </Text>
                </View>

                <View style={styles.pillarItem}>
                  <Text style={styles.pillarHeader}>2. COMMUTE ROUTE</Text>
                  <Text style={styles.pillarName}>{activeCombo.transport.provider}</Text>
                  <Text style={styles.pillarDetail}>
                    {activeCombo.transport.averageTripMinutes}m each way • £{activeCombo.costSummary.weeklyCommuteCost}/wk pass
                  </Text>
                </View>

                <View style={styles.pillarItem}>
                  <Text style={styles.pillarHeader}>3. STUDENT BANK</Text>
                  <Text style={styles.pillarName}>{activeCombo.banking.bankName}</Text>
                  <Text style={styles.pillarDetail}>
                    £{activeCombo.banking.overdraftLimitYear1} 0% Overdraft • {activeCombo.banking.headlineFeature}
                  </Text>
                </View>
              </View>

              {/* Trade-offs */}
              <Text style={styles.tradeoffHeading}>WHAT YOU GIVE UP (TRADE-OFFS)</Text>
              {activeCombo.tradeoffs.slice(0, 2).map((t, idx) => (
                <View key={idx} style={styles.tradeoffBox}>
                  <Text style={styles.tradeoffTitle}>{t.title}</Text>
                  <Text style={styles.tradeoffPro}>+ PRO: {t.advantage}</Text>
                  <Text style={styles.tradeoffCon}>- CON: {t.disadvantage}</Text>
                </View>
              ))}
            </View>

            {/* Alternatives Picker */}
            <Text style={styles.sectionHeading}>ALTERNATIVE PACKAGES</Text>
            {combinations.map((c) => (
              <TouchableOpacity
                key={c.id}
                onPress={() => setSelectedComboId(c.id)}
                style={[
                  styles.altCard,
                  selectedComboId === c.id && styles.altCardSelected,
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.altName}>{c.accommodation.name}</Text>
                  <Text style={styles.altDetail}>{c.accommodation.area} • {c.transport.mode}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.altCost}>£{c.costSummary.weeklyNetLivingCost}/wk</Text>
                  <Text style={c.costSummary.isUnderBudget ? styles.altSavings : styles.altOver}>
                    {c.costSummary.isUnderBudget ? `Save £${c.costSummary.budgetDifferenceWeekly}/wk` : 'Over budget'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* TAB 2: HOUSING COMPARISON */}
        {activeTab === 'housing' && (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>GLASGOW STUDENT HOUSING</Text>
            {MOCK_ACCOMMODATIONS.map((item) => {
              const transitCost = item.walkingTimeMins <= 15 ? 0 : 16.5;
              const bills = item.billsIncluded ? 0 : item.estimatedBillsWeekly;
              const trueCost = item.weeklyRent + bills + transitCost;

              return (
                <View key={item.id} style={styles.listingCard}>
                  <View style={styles.listingHeader}>
                    <Text style={styles.listingType}>{item.roomType}</Text>
                    <Text style={styles.listingWalk}>
                      {item.walkingTimeMins <= 15 ? `${item.walkingTimeMins}m walk` : `${item.transitTimeMins}m transit`}
                    </Text>
                  </View>

                  <Text style={styles.listingTitle}>{item.name}</Text>
                  <Text style={styles.listingAddress}>{item.address}</Text>

                  <View style={styles.costBox}>
                    <View style={styles.costRow}>
                      <Text style={styles.costLabel}>True Living Cost:</Text>
                      <Text style={styles.trueCostValue}>£{trueCost}/wk</Text>
                    </View>
                    <View style={styles.costRow}>
                      <Text style={styles.costSub}>Advertised Rent:</Text>
                      <Text style={styles.costSub}>£{item.weeklyRent}/wk</Text>
                    </View>
                    <View style={styles.costRow}>
                      <Text style={styles.costSub}>Estimated Bills:</Text>
                      <Text style={item.billsIncluded ? styles.billsInc : styles.billsExc}>
                        {item.billsIncluded ? 'Included (£0)' : `+£${item.estimatedBillsWeekly}/wk`}
                      </Text>
                    </View>
                    <View style={styles.costRow}>
                      <Text style={styles.costSub}>Deposit Required:</Text>
                      <Text style={styles.costSub}>£{item.deposit}</Text>
                    </View>
                  </View>

                  <Text style={styles.sourceText}>Source: {item.source}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* TAB 3: TRANSIT PASSES */}
        {activeTab === 'transit' && (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>TRANSIT PASSES & FARES</Text>
            {MOCK_TRANSPORTS.map((t) => (
              <View key={t.id} style={styles.listingCard}>
                <View style={styles.listingHeader}>
                  <Text style={styles.listingType}>{t.mode.toUpperCase()}</Text>
                  <Text style={styles.listingWalk}>{t.averageTripMinutes} mins avg</Text>
                </View>

                <Text style={styles.listingTitle}>{t.passName}</Text>
                <Text style={styles.listingAddress}>{t.provider}</Text>

                <View style={styles.costBox}>
                  <View style={styles.costRow}>
                    <Text style={styles.costLabel}>Pass Cost:</Text>
                    <Text style={styles.trueCostValue}>
                      {t.costWeekly === 0 ? 'FREE' : `£${t.costWeekly}/wk`}
                    </Text>
                  </View>
                  <View style={styles.costRow}>
                    <Text style={styles.costSub}>Single Trip Fare:</Text>
                    <Text style={styles.costSub}>£{t.singleFareCost.toFixed(2)}</Text>
                  </View>
                  <View style={styles.costRow}>
                    <Text style={styles.costSub}>4-Week Pass:</Text>
                    <Text style={styles.costSub}>£{t.costMonthly}</Text>
                  </View>
                </View>

                <Text style={styles.sourceText}>{t.coverageArea}</Text>
              </View>
            ))}
          </View>
        )}

        {/* TAB 4: BANKING */}
        {activeTab === 'banking' && (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>STUDENT BANK ACCOUNTS</Text>
            {MOCK_BANK_ACCOUNTS.map((b) => (
              <View key={b.id} style={styles.listingCard}>
                <View style={styles.listingHeader}>
                  <Text style={styles.listingType}>{b.bankName}</Text>
                  <Text style={styles.bankValue}>+£{b.estimatedYearlyValue}/yr value</Text>
                </View>

                <Text style={styles.listingTitle}>{b.accountName}</Text>

                <View style={styles.costBox}>
                  <View style={styles.costRow}>
                    <Text style={styles.costLabel}>Year 1 0% Overdraft:</Text>
                    <Text style={styles.trueCostValue}>£{b.overdraftLimitYear1}</Text>
                  </View>
                  <View style={styles.costRow}>
                    <Text style={styles.costSub}>Intl Transfer Fee:</Text>
                    <Text style={styles.costSub}>
                      {b.internationalTransferFee === 0 ? '£0 Free' : `£${b.internationalTransferFee}`}
                    </Text>
                  </View>
                </View>

                <View style={{ marginTop: 8 }}>
                  <Text style={styles.perkTitle}>Key Features:</Text>
                  {b.perks.map((p, idx) => (
                    <Text key={idx} style={styles.perkItem}>• {p}</Text>
                  ))}
                </View>

                <Text style={styles.sourceText}>Best for: {b.bestFor}</Text>
              </View>
            ))}
          </View>
        )}

        {/* TAB 5: HEALTHCARE */}
        {activeTab === 'healthcare' && (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>NHS SCOTLAND HEALTHCARE &amp; RIGHTS</Text>

            {/* Scotland Perks Banner */}
            <View style={styles.metricCardPrimary}>
              <Text style={styles.metricLabel}>SCOTLAND LIVING ADVANTAGE</Text>
              <Text style={styles.metricValueLarge}>£0 Prescriptions</Text>
              <Text style={{ color: '#5EEAD4', fontSize: 12, marginTop: 4, fontWeight: '700' }}>
                100% Free NHS Prescriptions &amp; Dental under 26
              </Text>
              <Text style={{ color: '#94A3B8', fontSize: 11, marginTop: 6, lineHeight: 16 }}>
                In Scotland, students never pay prescription charges (saves £9.90/item vs England). Anyone under 26 gets free NHS dental checkups and cleanings.
              </Text>

              {profile.isInternational && (
                <View style={{ marginTop: 10, padding: 8, backgroundColor: 'rgba(217, 119, 6, 0.2)', borderRadius: 8, borderWidth: 1, borderColor: '#D97706' }}>
                  <Text style={{ color: '#FCD34D', fontSize: 11, fontWeight: 'bold' }}>
                    ⚠️ International Surcharge (IHS): £776/year
                  </Text>
                  <Text style={{ color: '#FDE68A', fontSize: 10, marginTop: 2 }}>
                    Mandatory upfront fee for student visas. Grants full NHS hospital &amp; GP access without per-visit fees.
                  </Text>
                </View>
              )}
            </View>

            {/* Healthcare Entitlements Cards */}
            <Text style={[styles.sectionHeading, { marginTop: 10 }]}>KEY HEALTH POLICIES</Text>
            {MOCK_HEALTHCARE_BENEFITS.map((b) => (
              <View key={b.id} style={styles.listingCard}>
                <View style={styles.listingHeader}>
                  <Text style={styles.listingType}>{b.badge}</Text>
                  <Text style={b.costInScotland === 0 ? styles.bankValue : styles.altOver}>
                    {b.costInScotland === 0 ? '£0 Free' : `£${b.costInScotland}/yr`}
                  </Text>
                </View>
                <Text style={styles.listingTitle}>{b.title}</Text>
                <Text style={[styles.aiSubtitle, { color: '#0F766E', fontWeight: '700', marginTop: 2 }]}>
                  {b.headline}
                </Text>
                <Text style={[styles.altDetail, { marginTop: 6, lineHeight: 16 }]}>
                  {b.description}
                </Text>
                <View style={{ marginTop: 8, paddingTop: 6, borderTopWidth: 1, borderTopColor: '#F1F5F9' }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: '#64748B' }}>ACTION NEEDED:</Text>
                  <Text style={{ fontSize: 11, color: '#334155', marginTop: 2 }}>{b.actionRequired}</Text>
                </View>
              </View>
            ))}

            {/* Campus Clinics List */}
            <Text style={[styles.sectionHeading, { marginTop: 10 }]}>CAMPUS CLINICS &amp; DIRECTORY</Text>
            {MOCK_HEALTHCARE_CLINICS.map((clinic) => (
              <View key={clinic.id} style={styles.listingCard}>
                <View style={styles.listingHeader}>
                  <Text style={styles.listingType}>{clinic.area}</Text>
                  {clinic.isStudentSpecialist && (
                    <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#0F766E' }}>Student Specialist</Text>
                  )}
                </View>
                <Text style={styles.listingTitle}>{clinic.name}</Text>
                <Text style={styles.listingAddress}>{clinic.address} • {clinic.postcode}</Text>
                <Text style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>
                  🚶 {clinic.walkingDistanceMins} mins walk from campus • 📞 {clinic.phone}
                </Text>
                <Text style={{ fontSize: 10, color: '#94A3B8', marginTop: 2 }}>{clinic.openingHours}</Text>

                <View style={{ marginTop: 8, paddingTop: 6, borderTopWidth: 1, borderTopColor: '#F1F5F9' }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: '#475569', marginBottom: 4 }}>SERVICES:</Text>
                  {clinic.services.slice(0, 3).map((s, idx) => (
                    <Text key={idx} style={{ fontSize: 10, color: '#334155' }}>✓ {s}</Text>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Profile Adjust Modal */}
      <Modal visible={showProfileModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Quick Budget Settings</Text>
            <Text style={styles.modalSubtitle}>Adjust your weekly budget allowance</Text>

            <View style={styles.budgetSelector}>
              {[180, 220, 260, 300].map((amt) => (
                <TouchableOpacity
                  key={amt}
                  onPress={() => setProfile({ ...profile, totalBudget: amt })}
                  style={[
                    styles.budgetButton,
                    profile.totalBudget === amt && styles.budgetButtonActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.budgetButtonText,
                      profile.totalBudget === amt && styles.budgetButtonTextActive,
                    ]}
                  >
                    £{amt}/wk
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowProfileModal(false)}
            >
              <Text style={styles.modalCloseText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandBadge: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandBadgeText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  profileButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  profileButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  activeTabItem: {
    borderBottomWidth: 2,
    borderBottomColor: '#0F172A',
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  activeTabLabel: {
    color: '#0F172A',
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    gap: 14,
  },
  metricCardPrimary: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 18,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  metricValueLarge: {
    fontSize: 34,
    fontWeight: '900',
    color: '#FFFFFF',
    marginVertical: 4,
  },
  metricUnit: {
    fontSize: 14,
    fontWeight: '500',
    color: '#94A3B8',
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  subMetric: {
    alignItems: 'center',
    flex: 1,
  },
  subMetricDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  subMetricLabel: {
    fontSize: 10,
    color: '#94A3B8',
  },
  subMetricValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 2,
  },
  marginPill: {
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: 'center',
  },
  marginText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  aiPackageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  aiBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  aiBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  aiBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0F172A',
  },
  scoreText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  aiTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  aiSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  reasonBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#0F172A',
  },
  reasonText: {
    fontSize: 11,
    color: '#334155',
    lineHeight: 16,
  },
  pillarsContainer: {
    marginTop: 12,
    gap: 8,
  },
  pillarItem: {
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 8,
  },
  pillarHeader: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 2,
  },
  pillarName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  pillarDetail: {
    fontSize: 11,
    color: '#475569',
    marginTop: 1,
  },
  tradeoffHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    marginTop: 14,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  tradeoffBox: {
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 8,
    marginBottom: 6,
  },
  tradeoffTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 3,
  },
  tradeoffPro: {
    fontSize: 11,
    color: '#047857',
    marginBottom: 2,
  },
  tradeoffCon: {
    fontSize: 11,
    color: '#BE123C',
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    marginTop: 8,
    letterSpacing: 0.5,
  },
  altCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  altCardSelected: {
    borderColor: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  altName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  altDetail: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  altCost: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  altSavings: {
    fontSize: 10,
    fontWeight: '700',
    color: '#047857',
  },
  altOver: {
    fontSize: 10,
    fontWeight: '700',
    color: '#BE123C',
  },
  listingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  listingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  listingType: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0F172A',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  listingWalk: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  listingTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  listingAddress: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  costBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    gap: 4,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  costLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  trueCostValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  costSub: {
    fontSize: 11,
    color: '#475569',
  },
  billsInc: {
    fontSize: 11,
    color: '#047857',
    fontWeight: '600',
  },
  billsExc: {
    fontSize: 11,
    color: '#B45309',
    fontWeight: '600',
  },
  sourceText: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 8,
  },
  bankValue: {
    fontSize: 11,
    color: '#047857',
    fontWeight: '700',
  },
  perkTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 2,
  },
  perkItem: {
    fontSize: 11,
    color: '#334155',
    lineHeight: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 16,
  },
  budgetSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  budgetButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  budgetButtonActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  budgetButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  budgetButtonTextActive: {
    color: '#FFFFFF',
  },
  modalCloseButton: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCloseText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
