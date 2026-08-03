# خطة التنفيذ الحالية

آخر تحديث: `2026-08-03`

هذا الملف يصف حالة التنفيذ الفعلية للمشروع وخطواته التالية. يعتمد التقييم على الشيفرة الموجودة في المستودع، وملفات الاختبار، و`AGENTS.md`، و`docs/architecture-decisions.md`، و`docs/open-questions.md`. اكتمال الواجهة الحالية لا يعني جاهزية المنتج للإنتاج؛ البيانات والإدارة والنماذج ما زالت تجريبية أو غير متصلة بمصادر حقيقية.

## دلالات الحالة

| الحالة | المعنى |
| --- | --- |
| **Completed** | منفذ وموجود في المستودع، وتم التحقق منه بالوسائل المذكورة. |
| **In progress** | يجري تنفيذه حاليًا ولم يكتمل بعد. |
| **Pending** | محدد كعمل لاحق، لكنه لم يبدأ بعد ولا يمنعه قرار حالي مباشر. |
| **Blocked** | لا يجوز أو لا يمكن تنفيذه قبل اعتماد قرار أو تزويد معلومات ناقصة. |
| **Deferred** | مؤجل عمدًا إلى مرحلة لاحقة أو مستبعد من النطاق الحالي. |

## ملخص الحالة

- **Completed** — اكتملت مرحلة تأسيس الواجهة الأمامية التجريبية: App Router، وTypeScript، وTailwind CSS، والعربية وRTL، والهوية، والمسارات العامة، ومسارات الإدارة، والبيانات التجريبية، ومعاينة الاستبيانات.
- **Completed** — المستودع المحلي على `main` مرتبط بـ`origin/main` في `ziyadalhd/ZainabWeb`.
- **Completed** — توجد نسخة منشورة يدويًا على Vercel، لكن هذا لا يحسم اعتماد Vercel كمزود الاستضافة النهائي في وثائق المعمارية.
- **In progress** — لا توجد أعمال تطبيقية نشطة وقت تحديث هذا الملف.
- **Pending** — توجد تحسينات تحقق وتشغيل يمكن تنفيذها دون تغيير نطاق المنتج، موضحة أدناه.
- **Blocked** — الانتقال إلى بيانات حقيقية، والمصادقة، والإرسال، وعمليات الإدارة محجوب حتى اعتماد المزودين والحقول وقواعد العمل.
- **Deferred** — الخصائص المستبعدة صراحة في `AGENTS.md` تظل مؤجلة ما لم يعتمدها المستخدم.

## خط الأساس التقني

| البند | الحالة | الدليل الحالي |
| --- | --- | --- |
| Next.js App Router | **Completed** | `next@16.2.12` ومسارات تحت `app/`. |
| React | **Completed** | `react@19.2.4` و`react-dom@19.2.4`. |
| TypeScript strict typing | **Completed** | `tsconfig.json` ونجاح `pnpm typecheck`. |
| Tailwind CSS | **Completed** | Tailwind CSS `4.x` وإعداد PostCSS الحالي. |
| ESLint flat config | **Completed** | `eslint.config.mjs` ونجاح `pnpm lint`. |
| Vitest component/unit testing | **Completed** | `vitest.config.mts` و`vitest.setup.ts` وخمسة ملفات اختبار. |
| Local Arabic font | **Completed** | `app/fonts.ts` وملفات `app/fonts/thmanyah-sans-*.woff2` باستخدام `next/font/local`. |
| Arabic RTL root | **Completed** | `app/layout.tsx` يحدد `lang="ar"` و`dir="rtl"`. |
| Production database | **Blocked** | لا يوجد مزود أو ORM معتمد، ولا توجد dependency أو adapter إنتاجي. |
| Admin authentication | **Blocked** | لا يوجد مزود أو تصميم مصادقة وصلاحيات معتمد. |
| API or mutation layer | **Blocked** | لا توجد `route.ts` أو Server Actions أو واجهات كتابة معتمدة. |

## الواجهة العامة

### المسارات

| المسار | الحالة | الوضع الحالي |
| --- | --- | --- |
| `/` | **Completed** | غلاف رئيسي عربي، شعار، روابط الأقسام، ومحتوى غير معتمد ظاهر كـplaceholder. |
| `/space-booking` | **Completed** | صفحة حالة انتظار دون نموذج مختلق. |
| `/celebration-booking` | **Completed** | صفحة حالة انتظار دون نموذج مختلق. |
| `/bayn-trips` | **Completed** | صفحة قسم بحالة محتوى قيد الإعداد. |
| `/literary-partner` | **Completed** | صفحة قسم بحالة محتوى قيد الإعداد. |
| `/events` | **Completed** | بطاقات فعاليات وفئات وحالة فارغة باستخدام بيانات تجريبية. |
| `/surveys` | **Completed** | فهرس الاستبيانات المعتمدة. |
| `/surveys/workshop-application` | **Completed** | حالة انتظار إلى حين اعتماد الحقول. |
| `/surveys/interested-contact` | **Completed** | حالة انتظار إلى حين اعتماد الحقول. |
| `/surveys/event-feedback` | **Completed** | معاينة الحقول الثلاثة المعتمدة، بلا إرسال أو حفظ. |
| `/contact` | **Completed** | الرقم `0537918640` وحالات غير قابلة للنقر للروابط الاجتماعية غير المعتمدة. |

### المحتوى والهوية

- **Completed** — نسختا الشعار موجودتان في `public/brand/` وتستخدمان عبر `components/brand/ClubLogo.tsx`.
- **Completed** — خط Thmanyah Sans مستخدم على الواجهة العامة والإدارة وحدود الأخطاء.
- **Completed** — النصوص العامة غير المعتمدة لا تُعرض كمحتوى نهائي، بل كحالات إعداد واضحة.
- **Blocked** — المقدمة النهائية، وفكرة الاسم، والأهداف، والمحتوى التسويقي تحتاج نصوصًا معتمدة من المستخدم.
- **Blocked** — روابط TikTok وInstagram تحتاج URLs حقيقية.
- **Blocked** — الهوية البصرية النهائية، بما فيها الألوان والصور والنبرة، لم تعتمد في الوثائق الحالية.

## الفعاليات والبيانات

- **Completed** — الأنواع موجودة في `lib/domain/types.ts`، ومنها `Event`, `Registration`, `WaitlistEntry`, و`SurveyResponse`.
- **Completed** — عقود القراءة المحايدة `EventCatalog` و`AdminDashboardSource` موجودة في `lib/data/contracts.ts`.
- **Completed** — التنفيذ الحالي معزول داخل `lib/demo/` ويستخدم سجلات اصطناعية فقط.
- **Completed** — `availability` يقرأ من البيانات، ولا يستنتج تلقائيًا من `capacity`.
- **Completed** — لا يوجد ترتيب أو استبدال تلقائي في `WaitlistEntry`.
- **Blocked** — استبدال `lib/demo/` بمصدر إنتاجي يحتاج قرار قاعدة البيانات وORM أو أسلوب الوصول للبيانات.
- **Blocked** — الحدود العمرية النهائية لـ`adults`, `youth`, و`children` غير معتمدة، لذلك لا يوجد تصنيف عمري تلقائي.
- **Blocked** — قواعد تعارض التقويم، والإلغاء، وأولوية قائمة الانتظار لم تعتمد.

## لوحة الإدارة

جميع المسارات التالية **Completed** كواجهات عرض تجريبية فقط:

- `/admin`
- `/admin/calendar`
- `/admin/events`
- `/admin/registrations/current`
- `/admin/registrations/previous`
- `/admin/interested`
- `/admin/waitlist`
- `/admin/messages`
- `/admin/surveys`

الحالة التشغيلية للوحة:

- **Completed** — `app/(dashboard)/admin/layout.tsx` يعزل الغلاف الإداري ويضيف `noindex` وتنبيه البيانات التجريبية.
- **Completed** — التقويم ميلادي بصياغة عربية باستخدام `ar-SA-u-ca-gregory` وتوقيت `Asia/Riyadh`.
- **Completed** — الجداول والمؤشرات تقرأ snapshot تجريبيًا ولا تحتوي عمليات mutation.
- **Blocked** — حماية `/admin` تحتاج مصادقة وصلاحيات معتمدة؛ إخفاء الرابط أو `noindex` ليس حماية أمنية.
- **Blocked** — إنشاء الفعاليات أو تعديلها أو إلغاؤها يحتاج تخزينًا دائمًا، وتحقيقًا من المدخلات، وتفويضًا على الخادم.
- **Blocked** — إجراءات الحضور والتذكير والاستبدال اليدوي تحتاج قواعد عمل ومزود رسائل معتمدين.

## النماذج والاستبيانات

- **Completed** — `features/surveys/components/EventFeedbackFormPreview.tsx` يعرض `hospitalityRating`, `materialRating`, و`suggestions` فقط.
- **Completed** — قيم التقييم من `5` إلى `1`، وزر الإرسال معطل، ولا يوجد submit handler أو نقل بيانات.
- **Completed** — طلب الورشة وتسجيل المهتمين لا يحتويان حقولًا مختلقة.
- **Blocked** — حقول workshop application غير معتمدة.
- **Blocked** — حقول interested contact غير معتمدة.
- **Blocked** — تخزين ردود event feedback يحتاج قرار قاعدة البيانات وسياسة الاحتفاظ بالبيانات الشخصية.
- **Pending** — بعد اعتماد الحقول والمزودين: إضافة validation مشترك، ثم تحقق خادمي authoritative، ثم اختبارات الأخطاء والخصوصية قبل تفعيل أي إرسال.

## التحقق والجودة

أعيد تشغيل التحقق على snapshot مطابق للمصدر الحالي بتاريخ `2026-08-03`:

| الأمر | الحالة | النتيجة |
| --- | --- | --- |
| `pnpm lint` | **Completed** | نجح دون أخطاء. |
| `pnpm typecheck` | **Completed** | نجح `tsc --noEmit`. |
| `pnpm test` | **Completed** | نجحت `5` ملفات و`7` اختبارات. |
| `pnpm build` | **Completed** | نجح Next.js production build وتوليد جميع المسارات الحالية كصفحات static. |

التغطية الحالية المثبتة تشمل:

- **Completed** — `app/layout.test.tsx`: العربية وRTL في الجذر.
- **Completed** — `components/navigation/MobileNavigation.test.tsx`: الفتح، التركيز، والإغلاق بـEscape.
- **Completed** — `features/events/components/EventList.test.tsx`: قائمة الفعاليات والحالة الفارغة.
- **Completed** — `features/surveys/components/EventFeedbackFormPreview.test.tsx`: حقول معاينة التقييم وسلوك عدم الإرسال.
- **Completed** — `lib/format/date.test.ts`: صياغة التاريخ العربية الميلادية.
- **Pending** — إضافة اختبار مماثل لـ`AdminMobileNavigation`؛ لا يوجد ملف اختبار له حاليًا.
- **Pending** — إضافة اختبارات مباشرة لاختيار نسخة `ClubLogo` وخصائص `alt` عند تعديل مكون الهوية مستقبلًا.
- **Pending** — إضافة route smoke tests أو browser automation في مرحلة تتطلب CI؛ لا يوجد إعداد Playwright أو GitHub Actions حاليًا.

## التشغيل والاستضافة وإدارة المصدر

- **Completed** — المستودع منشور في `https://github.com/ziyadalhd/ZainabWeb`، والفرع المحلي `main` يتتبع `origin/main`.
- **Completed** — توجد نسخة Vercel منشورة يدويًا على `https://bayn-cultural-club.vercel.app`.
- **Blocked** — اعتماد Vercel كمزود الاستضافة النهائي لم يسجل في `docs/architecture-decisions.md`، بينما `docs/open-questions.md` ما زال يسأل عن مزود الاستضافة.
- **Blocked** — ربط GitHub بـVercel للنشر التلقائي يعد تكاملًا خارجيًا، ويحتاج اعتماد النطاق وسلوك deployment قبل تنفيذه.
- **Pending** — بعد اعتماد الاستضافة: إعداد CI لتشغيل `pnpm lint`, `pnpm typecheck`, `pnpm test`, و`pnpm build` على pull requests.
- **Pending** — توثيق environment variables في `.env.example` فقط عندما تعتمد خدمات تحتاج متغيرات؛ لا توجد متغيرات مطلوبة حاليًا.

## القرارات المانعة

هذه البنود **Blocked** وتحتاج موافقة صريحة قبل التنفيذ:

1. اختيار database provider وطريقة ORM أو data access.
2. اختيار admin authentication وآلية authorization.
3. اعتماد حقول workshop application وinterested contact.
4. اعتماد أي حقول إضافية لـevent feedback، إن وجدت.
5. اعتماد قواعد calendar conflicts، وcancellation، وwaitlist priority.
6. اختيار messaging provider والقناة وجدول attendance reminders.
7. اعتماد حدود الأعمار للفئات الثلاث.
8. تزويد المحتوى النهائي وروابط TikTok وInstagram.
9. اعتماد hosting provider النهائي وسياسة CI/CD.
10. اعتماد سياسة حفظ وحذف وحماية personal data.

## ترتيب التنفيذ المقترح للمرحلة التالية

1. **Blocked** — حسم القرارات في `docs/open-questions.md` دون اختيار مزود أو قاعدة عمل بالافتراض.
2. **Pending** — تحديث `docs/architecture-decisions.md` بعد الموافقات، مع توثيق الأمن والخصوصية والهجرة.
3. **Blocked** — تنفيذ admin authentication وserver-side authorization قبل أي بيانات أو mutations إدارية حقيقية.
4. **Blocked** — إضافة persistence adapters خلف `EventCatalog` و`AdminDashboardSource` بعد اعتماد database provider.
5. **Blocked** — اعتماد form schemas، ثم إضافة server-side validation وعمليات الحفظ.
6. **Blocked** — استبدال demo snapshot تدريجيًا ببيانات حقيقية مع إبقاء fixtures للاختبارات فقط.
7. **Blocked** — تنفيذ event, registration, attendance, cancellation, وwaitlist workflows بعد اعتماد قواعدها.
8. **Deferred** — إضافة messaging/reminders حتى يعتمد provider والقناة والجدول الزمني.
9. **Pending** — توسيع الاختبارات لتشمل authorization، validation، error cases، وprivacy-sensitive behavior عند وجود هذه الوظائف.
10. **Pending** — تشغيل دورة التحقق الكاملة ومراجعة عربية وRTL على mobile وdesktop قبل كل نشر.

## النطاق المؤجل

تظل البنود التالية **Deferred** ولا تدخل التنفيذ دون موافقة صريحة جديدة:

- Online payments.
- Ticket generation.
- Newsletter functionality.
- Google Maps.
- Guest CRM أو Mini-CRM.
- Public user accounts.
- Automatic waitlist replacement.
- أي external integration غير معتمد.

## معيار الانتقال من الواجهة التجريبية إلى منتج تشغيلي

لا تنتقل حالة المشروع إلى تشغيل إنتاجي حتى تتحقق جميع النقاط التالية:

- **Blocked** — اعتماد وتطبيق authentication وauthorization للإدارة.
- **Blocked** — اعتماد وتطبيق persistence وسياسة personal data.
- **Blocked** — اعتماد الحقول وقواعد العمل والمزودين المطلوبة.
- **Pending** — إضافة server-side validation واختبارات الأمن والخصوصية.
- **Pending** — إزالة اعتماد مسارات التشغيل على `lib/demo/` مع إبقائه للاختبارات أو العرض المعزول فقط.
- **Pending** — توثيق environment variables والتشغيل والنشر والاستعادة.
- **Pending** — نجاح lint وtypecheck وtests وbuild وroute/browser verification على بيئة CI معتمدة.
