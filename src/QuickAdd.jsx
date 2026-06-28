// ============================================
// SUPABASE CONFIG
// ============================================
const SUPABASE_URL = 'https://dzmugxoxpoikhtmwqsil.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6bXVneG94cG9pa2h0bXdxc2lsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4ODU0OTQsImV4cCI6MjA5MjQ2MTQ5NH0.Edo_waBaSVOB6_G-i_W0DlA8WLg2ws_3zQAsWNSFBdA';
const USER_ID = 'ca0169ae-f0ba-40ce-9ff2-b7dfacce6380';
const TABLE = 'transactions';
const TIMEZONE = 'Asia/Karachi';

// ============================================
// MAIN TRIGGER — form submit hone par run hota hai
// ============================================
function onFormSubmit(e) {
  try {
    // Normalize event — works for both form-trigger and sheet-trigger
    let v = {};

    if (e && e.response) {
      // Form-based trigger (actual form submit)
      const itemResponses = e.response.getItemResponses();
      itemResponses.forEach(ir => {
        const title = ir.getItem().getTitle().trim(); // trim spaces from form field name
        v[title] = [String(ir.getResponse())];
      });
    } else if (e && e.namedValues) {
      // Sheet-based trigger OR our manual test — trim keys here too
      Object.keys(e.namedValues).forEach(k => {
        v[k.trim()] = e.namedValues[k];
      });
    } else {
      Logger.log('ERROR: Unknown event structure: ' + JSON.stringify(e));
      return;
    }

    Logger.log('Form values: ' + JSON.stringify(v));

    // Helper: safely get a single value
    const get = (key) => {
      const val = v[key];
      if (!val || val.length === 0) return null;
      const s = String(val[0]).trim();
      return s === '' ? null : s;
    };

    const amount = parseFloat(get('Amount'));

    // Form → Supabase column mapping
    const payload = {
      user_id: USER_ID,
      d: Utilities.formatDate(new Date(), TIMEZONE, 'yyyy-MM-dd'),
      t: get('Type'),
      a: isNaN(amount) ? null : amount,
      c: get('Category'),
      g: get('Group'),
      fa: get('From Account'),
      ta: get('To Account'),
      p: get('Party'),
      description: get('Description'),
    };

    // Khali (null) fields nikaal do
    Object.keys(payload).forEach(k => {
      if (payload[k] === null || payload[k] === undefined) {
        delete payload[k];
      }
    });

    Logger.log('Payload: ' + JSON.stringify(payload));

    // POST to Supabase
    const response = UrlFetchApp.fetch(`${SUPABASE_URL}/rest/v1/${TABLE}`, {
      method: 'post',
      contentType: 'application/json',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'return=minimal'
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });

    const code = response.getResponseCode();
    if (code < 200 || code >= 300) {
      Logger.log('SUPABASE ERROR ' + code + ': ' + response.getContentText());
    } else {
      Logger.log('Inserted successfully');
    }
  } catch (err) {
    Logger.log('EXCEPTION: ' + err.toString());
  }
}

// ============================================
// TEST FUNCTION — manually run karne ke liye
// ============================================
function testInsert() {
  const fakeEvent = {
    namedValues: {
      'Type': ['Expense'],
      'Amount': ['100'],
      'Description': ['TEST from Apps Script'],
      'Category': ['Food'],
      'Group': ['Personal'],
      'From Account': ['Cash'],
      'To Account': [''],
      'Party': ['']
    }
  };
  onFormSubmit(fakeEvent);
}
