import { ContractSection } from '@breeder/types';

// Default stud service contract template
export const DEFAULT_STUD_CONTRACT_SECTIONS: Omit<ContractSection, 'id'>[] = [
  {
    title: 'Parties',
    content: `This Stud Service Agreement is entered into on {{date}} between:

**Stud Owner:** {{studOwnerName}}
{{studOwnerAddress}}
Email: {{studOwnerEmail}}
Phone: {{studOwnerPhone}}

**Female Owner:** {{femaleOwnerName}}
{{femaleOwnerAddress}}
Email: {{femaleOwnerEmail}}
Phone: {{femaleOwnerPhone}}`,
    order: 1,
    editable: true,
    required: true,
  },
  {
    title: 'Dogs',
    content: `**Stud:** {{studName}}
Registration: {{studRegistration}}
Breed: {{studBreed}}

**Female:** {{femaleName}}
Registration: {{femaleRegistration}}
Breed: {{femaleBreed}}`,
    order: 2,
    editable: true,
    required: true,
  },
  {
    title: 'Service Fee',
    content: `The stud service fee for this breeding is **${{studFee}}**.

{{#if additionalBreedingFee}}
Additional breeding attempts beyond the first will be charged at **${{additionalBreedingFee}}** per breeding.
{{/if}}

{{#if pickOfLitter}}
In lieu of or in addition to the stud fee, the Stud Owner shall receive **pick of the litter** as follows:
- Pick: {{pickOfLitterDetails}}
{{/if}}

Payment Terms:
- Payment is due upon confirmation of pregnancy
- Payment must be made before puppies are delivered to new homes`,
    order: 3,
    editable: true,
    required: true,
  },
  {
    title: 'Breeding Terms',
    content: `1. The Female Owner agrees to present the female for breeding during her heat cycle as mutually agreed upon by both parties.

2. The Stud Owner agrees to provide stud service with reasonable attempts to achieve pregnancy.

3. If additional breeding attempts are needed within the same heat cycle, the Stud Owner will provide up to **{{maxBreedingAttempts}}** breeding attempts at the additional breeding fee specified above.

4. The breeding will be performed by:
   - [ ] Natural breeding
   - [ ] Artificial insemination (AI)
   - [ ] Surgical AI

5. All breeding dates and methods will be documented and provided to both parties.`,
    order: 4,
    editable: true,
    required: true,
  },
  {
    title: 'Health Requirements',
    content: `Both parties agree that their dogs meet the following health requirements:

1. Current on all vaccinations (DHPP, Rabies, Bordetella)
2. Negative brucellosis test within 30 days of breeding
3. Free from contagious diseases and parasites
4. In good physical condition and suitable for breeding

The Female Owner agrees to provide proof of health testing and vaccination records upon request.

The Stud Owner certifies that the stud has the following health clearances:
{{studHealthClearances}}`,
    order: 5,
    editable: true,
    required: true,
  },
  {
    title: 'Live Puppy Guarantee',
    content: `The Stud Owner guarantees a live litter or a return service:

- If no puppies are born alive, the Stud Owner will provide one (1) return service to the same female at no additional stud fee during her next season.
- The return service must be used within **18 months** of the original breeding date.
- This guarantee is void if the female is bred to another male before the return service.
- The Female Owner must notify the Stud Owner within 7 days if no puppies are born alive.

This guarantee does not cover:
- Puppies lost after 48 hours of life
- Complications due to whelping difficulties
- Deaths due to injury, disease, or improper care
- Failures to conceive due to female reproductive issues`,
    order: 6,
    editable: true,
    required: false,
  },
  {
    title: 'Responsibilities of Female Owner',
    content: `The Female Owner agrees to:

1. Provide proper pre-natal and post-natal care for the female
2. Seek veterinary care when needed during pregnancy and whelping
3. Provide proof of litter registration within 60 days of whelping
4. Provide copies of puppy registration applications to Stud Owner upon request
5. Not breed the female to any other male during this heat cycle
6. Notify Stud Owner within 24 hours of whelping with puppy count and sexes
7. Provide photos and updates upon request`,
    order: 7,
    editable: true,
    required: false,
  },
  {
    title: 'Responsibilities of Stud Owner',
    content: `The Stud Owner agrees to:

1. Provide a healthy, sound stud dog suitable for breeding
2. Provide proof of health clearances and pedigree information
3. Cooperate with breeding schedule and timing
4. Sign litter registration papers in a timely manner
5. Provide stud information for registration purposes
6. Not breed the stud to any female with known genetic health issues`,
    order: 8,
    editable: true,
    required: false,
  },
  {
    title: 'Registration',
    content: `Both parties agree that:

1. All puppies from this breeding will be registered with: {{registryName}}
2. The Stud Owner will sign litter registration papers within 14 days of request
3. The Female Owner will register the litter within 60 days of whelping
4. Individual puppy registrations are the responsibility of the Female Owner

Registration Type:
- [ ] Full registration
- [ ] Limited registration
- [ ] Other: _______________`,
    order: 9,
    editable: true,
    required: false,
  },
  {
    title: 'Additional Services',
    content: `{{#if addOns}}
The following additional services are included:

{{#each addOns}}
- {{service}}: ${{cost}} {{#if paid}}(Paid){{else}}(Unpaid){{/if}}
{{/each}}
{{/if}}

Additional terms and services can be added here as mutually agreed upon.`,
    order: 10,
    editable: true,
    required: false,
  },
  {
    title: 'Dispute Resolution',
    content: `In the event of any dispute arising from this agreement, both parties agree to:

1. First attempt to resolve the matter through direct communication
2. If unresolved, seek mediation before pursuing legal action
3. Each party will bear their own costs unless a court orders otherwise

This agreement shall be governed by the laws of {{state}}.`,
    order: 11,
    editable: true,
    required: false,
  },
  {
    title: 'Signatures',
    content: `By signing below, both parties agree to the terms and conditions outlined in this Stud Service Agreement.

**Stud Owner Signature:**
Name: {{studOwnerName}}
Date: _______________
Signature: _______________

**Female Owner Signature:**
Name: {{femaleOwnerName}}
Date: _______________
Signature: _______________`,
    order: 12,
    editable: false,
    required: true,
  },
];
