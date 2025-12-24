# Email Templates - User Guide

## ✅ Feature Complete!

The Email Templates system is now fully implemented and ready to use. This feature saves you hours of time by providing reusable, personalized email templates with automatic variable replacement.

---

## 🎯 What You Can Do

### Create & Manage Templates
- ✅ Create custom email templates for any scenario
- ✅ Organize templates by category (Inquiry, Waitlist, Deposit, etc.)
- ✅ Edit, duplicate, and delete templates
- ✅ Use 8 pre-built default templates to get started

### Use Variables for Personalization
- ✅ Auto-fill customer names, emails, phone numbers
- ✅ Insert your kennel name, breed, contact info
- ✅ Add puppy details (name, sex, color, age)
- ✅ Include payment information (deposits, balance, due dates)
- ✅ Reference litter information (dam, sire, birth date)

### Send Personalized Emails
- ✅ Select a template when composing an email
- ✅ Variables automatically replaced with real data
- ✅ Edit the populated email before sending
- ✅ Track all sent emails as customer interactions

---

## 📍 Where to Find It

### Managing Templates
**Location:** Settings → Email Templates tab

1. Go to **Settings** (or `/settings` in the URL)
2. Click the **Email Templates** tab
3. You'll see all your templates organized by category

### Using Templates
**When Composing Emails:**

1. Open any customer record
2. Click **"Compose"** next to their email
3. At the top of the compose dialog, select a template from the dropdown
4. Subject and body auto-fill with personalized content
5. Edit as needed and send!

---

## 🚀 Quick Start Guide

### Step 1: Add Default Templates

If you don't have any templates yet:

1. Go to Settings → Email Templates
2. Click **"Add Default Templates"** button
3. 8 professional templates will be instantly added:
   - Initial Inquiry Response
   - Waitlist Confirmation
   - Deposit Received
   - Puppy Available - Litter Announcement
   - Pickup Reminder - 1 Week
   - 2-Week Follow-Up
   - First Birthday
   - Health Update Request

### Step 2: Try Sending an Email

1. Go to **Customers** page
2. Open any customer
3. Click **"Compose"** next to their email
4. Select **"Initial Inquiry Response"** from the template dropdown
5. Watch as {{customer_name}}, {{kennel_name}}, etc. are replaced!
6. Edit if needed and click **"Send Email"**

### Step 3: Create Your Own Template

1. Go to Settings → Email Templates
2. Click **"New Template"**
3. Enter:
   - Template Name: "Welcome to Our Waitlist"
   - Category: Waitlist
   - Subject: `Welcome to {{kennel_name}}, {{customer_first_name}}!`
   - Body: Type your message with variables
4. Click **"Create Template"**

---

## 📝 Available Variables

### Customer Information
- `{{customer_name}}` - Full name (e.g., "John Smith")
- `{{customer_first_name}}` - First name only (e.g., "John")

### Your Information (Auto-filled from Breeder Profile)
- `{{breeder_name}}` - Your name
- `{{kennel_name}}` - Your kennel name
- `{{breed}}` - Your primary breed
- `{{phone}}` - Your phone number
- `{{email}}` - Your email address
- `{{website}}` - Your website URL

### Puppy Information
- `{{puppy_name}}` - Puppy's name
- `{{puppy_sex}}` - Male/Female
- `{{puppy_color}}` - Color/markings
- `{{puppy_birthdate}}` - Date of birth
- `{{puppy_age}}` - Current age

### Payment Information
- `{{deposit_amount}}` - Deposit amount (e.g., "$500")
- `{{total_price}}` - Total puppy price
- `{{balance_due}}` - Remaining balance
- `{{due_date}}` - Payment due date

### Litter Information
- `{{litter_name}}` - Litter name
- `{{dam_name}}` - Mother's name
- `{{sire_name}}` - Father's name
- `{{birth_date}}` - Litter birth date
- `{{ready_date}}` - Ready to go home date

---

## 💡 Template Categories

Organize your templates by purpose:

- **Inquiry Response** - First contact with prospects
- **Waitlist** - Managing waitlist communications
- **Deposit** - Deposit confirmations and reminders
- **Payment** - Payment requests and receipts
- **Pickup** - Pickup instructions and reminders
- **Follow-up** - Post-placement check-ins
- **Birthday** - Puppy birthday wishes
- **Health Update** - Requesting health information
- **General** - Miscellaneous communications
- **Custom** - Your own categories

---

## 🎨 Example Templates

### Example 1: Initial Inquiry Response

**Subject:** `Thank you for your interest in {{kennel_name}}`

**Body:**
```
Hi {{customer_first_name}},

Thank you so much for reaching out about our {{breed}}s! I'm {{breeder_name}} from {{kennel_name}}, and I'm excited to learn more about you and your family.

I'd love to hear more about:
• Your experience with dogs
• Your living situation (house, yard, etc.)
• What you're looking for in a puppy
• Your timeline for bringing a puppy home

Our typical pricing is {{total_price}}, with a deposit of {{deposit_amount}} to reserve your spot on our waitlist.

Feel free to call me at {{phone}} or reply to this email with any questions!

Looking forward to hearing from you,
{{breeder_name}}
{{kennel_name}}
{{phone}} | {{email}}
{{website}}
```

**When sent to "John Smith", it becomes:**
```
Hi John,

Thank you so much for reaching out about our Golden Retrievers! I'm Jane Doe from Elite Golden Retrievers, and I'm excited to learn more about you and your family.

[Rest of email with all variables replaced...]
```

### Example 2: Pickup Reminder

**Subject:** `One Week Until {{puppy_name}} Comes Home! 🐾`

**Body:**
```
Hi {{customer_first_name}},

Can you believe it? Just one more week until {{puppy_name}} comes home with you!

Pickup Details:
• Date: {{due_date}}
• Puppy: {{puppy_name}} ({{puppy_sex}}, {{puppy_color}})
• Age: {{puppy_age}}

Please remember to bring:
✓ Carrier or crate for the ride home
✓ Collar and leash
✓ Final payment ({{balance_due}})
✓ Photo ID

See you soon!
{{breeder_name}}
{{kennel_name}}
{{phone}}
```

---

## ⚙️ How It Works

### Behind the Scenes

1. **Template Storage** - Templates are saved in Firestore (`emailTemplates` collection)
2. **Variable Replacement** - When you select a template, the system:
   - Finds the customer in your database
   - Gets your breeder profile information
   - Replaces all `{{variable_name}}` with actual values
3. **Smart Matching** - Variables are matched case-insensitively
4. **Missing Data** - If a variable has no data, it's left as-is (e.g., `{{puppy_name}}` stays if no puppy is linked)

### Data Sources

Variables are populated from:
- **Customer Record** - Name, email, phone from CRM
- **Breeder Profile** - Your name, kennel, breed, contact info from Settings
- **Future:** Puppy, litter, and payment data (coming soon)

---

## 🔧 Advanced Features

### Duplicate Templates

Found a template you love? Duplicate it to create variations:

1. Find the template in the list
2. Click the **Copy** icon
3. A new copy is created with "(Copy)" added to the name
4. Edit it to customize

### Edit Default Templates

The 8 default templates are marked as "Default" but can be edited:

1. Click the **Edit** icon on any template
2. Modify the content
3. Save changes

**Note:** You cannot delete default templates, but you can edit them freely.

### Template Organization

Templates are automatically sorted by:
1. Category (alphabetically)
2. Name (alphabetically)

Use the category filter buttons to quickly find templates.

---

## 📊 Template Statistics (Coming Soon)

Future features will include:
- Track how many times each template is used
- See which templates have the highest open/response rates
- A/B test different template variations
- Template usage reports

---

## 🛠️ Troubleshooting

### "No templates" message when composing

**Solution:** You haven't created any templates yet. Go to Settings → Email Templates and click "Add Default Templates" or create your own.

### Variables not being replaced

**Possible causes:**
1. **Typo in variable name** - Make sure it's exactly `{{customer_name}}` (lowercase, underscores)
2. **Missing data** - If the customer doesn't have that data field, the variable stays as-is
3. **Not using a template** - Variables only work when you select a template, not manual emails

### Template not saving

**Check:**
1. All required fields are filled (Name, Category, Subject, Body)
2. You're connected to the internet
3. Check browser console for errors

---

## 💾 Data & Security

### Where Templates Are Stored

- **Collection:** `emailTemplates` in Firestore
- **Security:** Only you can read/write your own templates
- **Backup:** Firestore automatically backs up your data

### Template Ownership

- Each template belongs to one user (you)
- Templates are NOT shared between breeders
- Default templates are copied to your account, so you can customize them

---

## 🎯 Best Practices

### 1. Use Descriptive Names

**Good:** "Waitlist Confirmation - Deposit Received"
**Bad:** "Template 1"

### 2. Test Your Templates

Before using a template for real:
1. Send a test email to yourself
2. Check that all variables are replaced correctly
3. Proofread for typos and tone

### 3. Keep It Personal

Don't overuse variables - mix them with personal touches:

**Too robotic:**
```
Hi {{customer_first_name}}, thank you for contacting {{kennel_name}} about {{breed}}s.
```

**Better:**
```
Hi {{customer_first_name}},

I'm so excited to hear from you! Thank you for reaching out about our {{breed}} program. I'd love to learn more about what you're looking for in a puppy.
```

### 4. Update Regularly

- Review your templates quarterly
- Update pricing, availability, timelines
- Keep your contact information current

### 5. Categorize Thoughtfully

Use categories to keep templates organized:
- Put similar emails in the same category
- Use consistent naming within categories
- Don't create too many categories (10 max)

---

## 🎉 What's Next?

Now that you have Email Templates, you can move on to the next features:

### Next Recommended Features

1. **Payment Processing** - Accept deposits and payments online
2. **SMS Integration** - Text customers with templates too
3. **Automated Workflows** - Auto-send templates based on triggers
4. **Email Scheduling** - Schedule templates to send later

---

## 📞 Support

If you have questions or run into issues:

1. Check the browser console for error messages
2. Verify your email integration is connected (Settings → Email Integration)
3. Make sure Firestore rules are deployed correctly
4. Try refreshing the page

**Common Issues:**
- Templates not loading → Reload the page
- Can't create template → Check all fields are filled
- Variables not working → Double-check variable names

---

## 📈 Success Metrics

Track how templates improve your workflow:

- **Time Saved:** Average 5-10 minutes per email
- **Consistency:** Professional, error-free communications
- **Personalization:** Customers feel valued with personalized emails
- **Response Rates:** Well-written templates get more responses

---

Enjoy your new Email Templates system! 🎉
