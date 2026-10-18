import { ChatMessage, ChatResponse, ChatSuggestedAction, ChatCostBreakdown } from '../types';

export interface ChatEngineOptions {
  userMessage: string;
  history?: ChatMessage[];
  studentCategory?: 'home_scotland' | 'home_uk_other' | 'international';
  university?: string;
}

export function generateChatbotResponse(options: ChatEngineOptions): ChatResponse {
  const query = options.userMessage.trim().toLowerCase();
  const rawText = options.userMessage;

  // 1. RENT & COST CALCULATOR INTENT
  // Detects if user mentions a number with rent, flat, pw, /wk, pounds, etc.
  const rentMatch = rawText.match(/(?:£|\$)?\s*(\d{2,4})\s*(?:per\s*week|\/wk|\/week|a\s*week|pw|rent|room|flat)?/i);
  const mentionsRentQuery = 
    query.includes('rent') || 
    query.includes('flat') || 
    query.includes('cost') || 
    query.includes('bills') || 
    query.includes('dennistoun') || 
    query.includes('west end') || 
    query.includes('finnieston') || 
    query.includes('southside') || 
    query.includes('partick') || 
    query.includes('hillhead') ||
    query.includes('calculate');

  if (mentionsRentQuery && rentMatch && parseInt(rentMatch[1], 10) >= 60 && parseInt(rentMatch[1], 10) <= 600) {
    const rentWeekly = parseInt(rentMatch[1], 10);
    
    // Detect location context
    let area = 'Glasgow Private Flat';
    let transitWeekly = 16.50; // default subway/train pass
    let commuteHours = 5.2;

    if (query.includes('west end') || query.includes('hillhead') || query.includes('partick')) {
      area = 'Glasgow West End';
      transitWeekly = 0; // walking distance
      commuteHours = 1.2;
    } else if (query.includes('dennistoun') || query.includes('east end')) {
      area = 'Dennistoun / East End';
      transitWeekly = 16.50; // ScotRail / First Bus
      commuteHours = 5.8;
    } else if (query.includes('southside') || query.includes('shawlands')) {
      area = 'Southside Glasgow';
      transitWeekly = 16.50; // Subway / Train
      commuteHours = 4.8;
    } else if (query.includes('finnieston')) {
      area = 'Finnieston';
      transitWeekly = 5.00; // occasional cycle / bus
      commuteHours = 2.0;
    }

    const billsWeekly = query.includes('bills included') ? 0 : 28.50;
    const totalWeekly = rentWeekly + billsWeekly + transitWeekly;
    const totalMonthly = Math.round((totalWeekly * 52) / 12);
    const upfrontDeposit = Math.round(rentWeekly * 5); // 5 weeks Scottish legal max
    const upfrontFirstMonth = Math.round((rentWeekly * 52) / 12);
    const totalDay1Cash = upfrontDeposit + upfrontFirstMonth;

    const breakdown: ChatCostBreakdown = {
      title: `${area} (£${rentWeekly}/wk headline rent)`,
      rentWeekly,
      billsWeekly,
      transitWeekly,
      totalWeekly,
      totalMonthly,
      upfrontDeposit,
      hoursCommuteWeekly: commuteHours,
    };

    let reply = `### 📊 What will my weekly budget look like? (£${rentWeekly}/wk in ${area})\n\n`;
    reply += `Most students look only at the headline rent of **£${rentWeekly}/week**, but here is what you will actually pay:\n\n`;
    reply += `* **Advertised Rent:** £${rentWeekly}/week\n`;
    reply += `* **Estimated Bills (Gas, Electricity, Wi-Fi):** £${billsWeekly.toFixed(2)}/week ${billsWeekly === 0 ? '*(Included)*' : '*(Glasgow winter average for tenements)*'}\n`;
    reply += `* **Transit to Campus:** £${transitWeekly.toFixed(2)}/week ${transitWeekly === 0 ? '*(Walking distance to campus)*' : '*(Glasgow Subway/Bus pass)*'}\n\n`;
    reply += `**➡️ True Living Cost:** **£${totalWeekly.toFixed(2)}/week** (~**£${totalMonthly}/month**)\n\n`;
    reply += `#### ⚠️ Day-1 Move-in Cash Barrier:\n`;
    reply += `Under Scottish tenancy law, deposits are capped at 5 weeks rent (£${upfrontDeposit}). Plus your first month's advance rent (£${upfrontFirstMonth}), you will need **£${totalDay1Cash} cash ready in your bank** before getting keys.\n\n`;
    reply += `> 💡 **Tip:** If you are under 22 living in Scotland, you can get a **free NEC bus pass**, cutting the transit cost to **£0/week**!`;

    const suggestedActions: ChatSuggestedAction[] = [
      { label: 'View Accommodation Listings', href: '/accommodation', icon: 'home' },
      { label: 'Compare Transit Passes', href: '/transport', icon: 'transit' },
      { label: 'Calculate Full Budget', href: '/onboarding', icon: 'budget' },
    ];

    const quickReplies = [
      'Is on-campus halls cheaper all-in?',
      'How do I get the Free Bus Pass?',
      'Do students pay council tax in Scotland?',
      'Which bank gives a free Railcard?',
    ];

    return {
      reply,
      costBreakdown: breakdown,
      suggestedActions,
      quickReplies,
    };
  }

  // 2. SCOTTISH FREE BUS PASS (UNDER 22 NEC)
  if (
    query.includes('bus') || 
    query.includes('under 22') || 
    query.includes('free travel') || 
    query.includes('nec') || 
    query.includes('young scot') ||
    query.includes('travel card')
  ) {
    const reply = `### 🚌 Scottish Young Persons' Free Bus Travel Scheme (Under 22)

Good news! In Scotland, the government provides **100% Free Bus Travel** for anyone aged 16 to 21 through the **National Entitlement Card (NEC)**.

#### 🔑 Who Qualifies?
* **Scottish Home Students** (aged 16–21)
* **Rest of UK Students** (living in Scotland for university)
* **International Students on Student Visas** (aged 16–21 resident in Glasgow!)

#### 💰 How Much You Save:
* Glasgow First Bus student passes cost **£15.50/week** (~**£62/month** or **£744/academic year**).
* With the free NEC card, your bus cost across Glasgow and all of Scotland is **£0**!

#### 📝 How to Apply:
1. Visit **[getyournec.scot](https://getyournec.scot)**
2. Provide your proof of address (tenancy agreement or Glasgow Uni term-time address) and ID (passport or driving licence).
3. The physical smartcard is mailed directly to your Glasgow address in 5–10 working days.`;

    return {
      reply,
      suggestedActions: [
        { label: 'Explore Transit Passes', href: '/transport', icon: 'transit' },
        { label: 'Subway vs Bus Break-even', href: '/transport', icon: 'transit' },
      ],
      quickReplies: [
        'How does Glasgow Subway pricing work?',
        'Which student bank gives a free Railcard?',
        'What healthcare is free in Scotland?',
      ],
    };
  }

  // 3. NHS SCOTLAND HEALTHCARE & FREE PRESCRIPTIONS
  if (
    query.includes('health') || 
    query.includes('nhs') || 
    query.includes('prescription') || 
    query.includes('dentist') || 
    query.includes('doctor') || 
    query.includes('gp') || 
    query.includes('medicine') ||
    query.includes('stobhill') ||
    query.includes('ihs') ||
    query.includes('emergency')
  ) {
    const reply = `### 🏥 NHS Scotland Student Entitlements & Clinic Guide

Scotland has significant healthcare financial advantages for university students compared to England:

#### 1. 100% Free Prescriptions (£0)
* In England, NHS prescriptions cost **£9.90 per item**.
* In Scotland, all NHS prescriptions are **100% FREE (£0)** for everyone, saving students with regular asthma, allergies, or mental health medication **£120–£240/year**.

#### 2. Free Dental & Eye Examinations
* **Free NHS dental check-ups** for all students aged **under 26**.
* **Free NHS eye tests** across opticians throughout Scotland.

#### 3. International Students (IHS):
* If you paid the **Immigration Health Surcharge (IHS)** (£776/year) during your visa application, you receive full free NHS Scotland coverage—GP appointments, emergency visits, and hospital care with **no co-pays**.

#### 📍 Emergency & Fast Triage in Glasgow:
* **Non-Emergency / Urgent advice:** Call **NHS 111** first for phone triage before visiting clinics.
* **Minor Injuries (Cuts, Sprains, Burns, Suspected Breaks):** Go to **Stobhill Hospital Minor Injuries Unit** (walk-in 9am–9pm). Avoids 6+ hour queues at main emergency rooms!
* **Life Threatening:** Call **999** or go to **Queen Elizabeth University Hospital (QEUH)**.
* **Local Student GP:** Register at **Barclay Medical Practice** (inside UofG Frazer Building) or **Woodside Health Centre**.`;

    return {
      reply,
      suggestedActions: [
        { label: 'View Healthcare Guide & Clinics', href: '/healthcare', icon: 'health' },
        { label: 'Register with Glasgow Student GP', href: '/healthcare', icon: 'health' },
      ],
      quickReplies: [
        'How much is the International Student Visa IHS?',
        'Where is the closest clinic to Glasgow Uni?',
        'How to get free dental treatment under 26?',
      ],
    };
  }

  // 4. STUDENT BANK ACCOUNTS & FREE RAILCARDS
  if (
    query.includes('bank') || 
    query.includes('account') || 
    query.includes('railcard') || 
    query.includes('overdraft') || 
    query.includes('santander') || 
    query.includes('natwest') || 
    query.includes('hsbc') ||
    query.includes('monzo') ||
    query.includes('wise')
  ) {
    const reply = `### 💳 Student Banking & Financial Perk Comparison

Choosing the right student account can earn you **over £200 in free benefits** and protect you from high debt fees:

#### 🥇 #1 Recommendation: Santander 1|2|3 Student Account
* **Perk:** Free **4-Year 16-25 Railcard** (saves **1/3 off all UK train travel**, worth £120+).
* **Overdraft:** Up to **£1,500 (Year 1) growing to £2,000 (Year 3)** at **0% interest**.
* **Best For:** Home & RUK students who travel between Glasgow, Edinburgh, Manchester, or London.

#### 🥈 NatWest / Royal Bank of Scotland (RBS) Student
* **Perk:** **£100 upfront cash incentive** + 4-year Tastecard (restaurant discounts).
* **Overdraft:** Up to £2,000 at 0% interest.

#### 🥉 International Students (Fast Account Opening):
* Traditional UK high-street banks (Santander, NatWest) often require 2–4 weeks and physical UK proof of address.
* **Monzo, Starling, and Revolut:** Open an account in 10 minutes on your phone using your passport and biometric residence permit (BRP). Zero foreign exchange fees when transferring money from abroad!`;

    return {
      reply,
      suggestedActions: [
        { label: 'Compare All Student Bank Accounts', href: '/banking', icon: 'bank' },
        { label: 'Calculate Living Budget', href: '/dashboard', icon: 'budget' },
      ],
      quickReplies: [
        'Can international students get a 0% overdraft?',
        'How do I link a Railcard to Glasgow Subway?',
        'Is NatWest cash perk better than Santander Railcard?',
      ],
    };
  }

  // 5. COUNCIL TAX & TENANCY RIGHTS
  if (
    query.includes('council tax') || 
    query.includes('deposit') || 
    query.includes('landlord') || 
    query.includes('hmo') || 
    query.includes('contract')
  ) {
    const reply = `### ⚖️ Scottish Student Tenancy & Council Tax Rules

Glasgow has strict tenant protection laws that save students money if you know your rights:

#### 1. 100% Council Tax Exemption
* Full-time students in Scotland are **100% exempt from Council Tax** (saving ~£1,400 to £2,100/year!).
* **Action Required:** As soon as you enroll, download your **Council Tax Exemption Certificate** from your university student portal (e.g. MyCampus for UofG) and upload it to the Glasgow City Council online portal.
* *Note:* If you share a flat with a non-student, the property loses the 100% exemption (reduced to a 25% single-occupant discount).

#### 2. Tenancy Deposit Protection (5 Weeks Max):
* In Scotland, the legal maximum security deposit is **5 weeks rent** (e.g. £700 on a £140/wk room).
* Landlords **MUST deposit your money with an approved tenancy deposit scheme** (SafeDeposits Scotland, My|Deposits Scotland, or Letting Protection Service Scotland) within 30 working days.

#### 3. HMO Licensing:
* If 3 or more unrelated students share a flat with shared kitchen/bathroom, the landlord **must possess an HMO license** from Glasgow City Council. Never sign an unlicensed flat for 3+ people.`;

    return {
      reply,
      suggestedActions: [
        { label: 'Browse Verified Accommodations', href: '/accommodation', icon: 'home' },
        { label: 'Check Upfront Cash on Dashboard', href: '/dashboard', icon: 'budget' },
      ],
      quickReplies: [
        'What happens if I live with a non-student?',
        'How much deposit can a landlord ask for?',
        'Calculate bills for £150/week flat',
      ],
    };
  }

  // 6. OUTER FLAT VS CAMPUS HALLS TRADE-OFF
  if (
    query.includes('tradeoff') || 
    query.includes('outer flat') || 
    query.includes('campus hall') || 
    query.includes('is it worth') || 
    query.includes('cheap flat')
  ) {
    const reply = `### ⚖️ Outer Flat vs. Campus Hall: The Real Numbers

Many Glasgow freshers choose a cheap flat in Dennistoun or Southside to save money, only to realize they didn't save anything after transit and bills:

| Factor | Outer Private Flat (Dennistoun) | On-Campus Hall (West End) |
| :--- | :--- | :--- |
| **Advertised Rent** | **£118 / week** | £185 / week |
| **Utility Bills (Gas, Elec, Wi-Fi)** | +£28 / week | **£0 (Included)** |
| **Transit to Campus** | +£16.50 / week (Subway/Rail) | **£0 (Walk to lecture)** |
| **True Weekly Cost** | **£162.50 / week** | **£185.00 / week** |
| **Weekly Commuting Burden** | **5.8 hours lost per week** | **0 hours lost** |
| **Upfront Cash Barrier** | **£1,098** (5-wk deposit + 1st mo) | **£250** (Holding deposit) |

#### 💡 The Decision Verdict:
The real financial difference is only **£22.50/week** (~£97/month). In exchange for £22.50, you save **24 hours every month** in travel time, have zero heating bill anxiety in winter, and need **£848 less upfront cash** on move-in day.`;

    return {
      reply,
      suggestedActions: [
        { label: 'See AHA! Simulator on Home', href: '/', icon: 'home' },
        { label: 'Check Alternative Packages', href: '/dashboard', icon: 'budget' },
      ],
      quickReplies: [
        'Calculate my exact budget',
        'How much do utility bills cost in winter?',
        'What is the best student bank?',
      ],
    };
  }

  // 7. DEFAULT / GREETING / GENERAL STUDENT LIVING QUERY
  return {
    reply: `👋 **Hi there! I am Finley, your Glasgow Student Living & Cost AI Advisor.**

I help university students across Glasgow (UofG, Strathclyde, GCU) discover the **real cost of living** before signing leases or choosing accounts.

Here is what I can help you with right now:
* 🧮 **Calculate True Living Cost:** Type any rent (e.g. *"I found a flat for £135/wk in Dennistoun"*) and I'll calculate your bills, subway pass, and upfront cash.
* 🚌 **Scottish Free Bus Travel:** How to get the under-22 Scottish NEC card for 100% free bus travel.
* 🏥 **NHS Scotland Perks:** Why prescriptions are £0 in Scotland and where the fastest campus walk-in clinics are.
* 💳 **Student Bank Accounts:** Which bank gives the free 4-year Railcard and 0% overdraft.
* ⚖️ **Scottish Tenancy Rights:** 5-week deposit caps and 100% student council tax exemptions.

What would you like to check today?`,
    suggestedActions: [
      { label: 'Calculate Living Budget', href: '/onboarding', icon: 'budget' },
      { label: 'Browse Accommodation', href: '/accommodation', icon: 'home' },
      { label: 'Healthcare Guide', href: '/healthcare', icon: 'health' },
      { label: 'Compare Banking', href: '/banking', icon: 'bank' },
    ],
    quickReplies: [
      'Calculate true cost for £130/wk flat',
      'Am I eligible for free bus travel under 22?',
      'What healthcare is free in Scotland?',
      'Which bank gives a free 4-year Railcard?',
    ],
  };
}
