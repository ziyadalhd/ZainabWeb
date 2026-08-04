# خطة التنفيذ الحالية

آخر تحديث: `2026-08-04`

هذا الملف يعكس الحالة الفعلية للفرع `agent/phase-2-events`. العلامات مبنية على الملفات الموجودة ونتائج الفحوص المنفذة، ولا تعتبر العمل مكتملًا إذا بقي تحقق أو إجراء يدوي مطلوب.

## دلالات الحالة

| الحالة | المعنى |
| --- | --- |
| **Completed** | منفذ وموجود وتم التحقق منه. |
| **In progress** | منفذ جزئيًا أو ما زال تحت التحقق. |
| **Pending** | لم يبدأ بعد، لكنه لا يواجه مانعًا حاليًا. |
| **Blocked** | يحتاج إجراءً أو معلومة خارج المستودع. |
| **Deferred** | مؤجل عمدًا إلى مرحلة لاحقة. |

## ملخص المرحلة الثانية

- **Completed** — إنشاء مورد Supabase مجاني عبر Vercel Marketplace وربطه بمشروع `bayn-cultural-club` في Mumbai (`bom1`).
- **Completed** — إضافة `@supabase/supabase-js@2.112.0`, `@supabase/ssr@0.12.4`, و`supabase@2.111.0` مع تحديث `pnpm-lock.yaml`.
- **Completed** — إضافة migrations لجدولي `events` و`admin_users`، ودالة تحقق داخل `private`, وRLS, وgrants صريحة، ومنع `DELETE`.
- **Completed** — تطبيق migrations على قاعدة Supabase المرتبطة دون إضافة أي بيانات تجريبية.
- **Completed** — نجاح `13` اختبار pgTAP فعليًا على القاعدة المرتبطة ثم `rollback`.
- **Completed** — تنفيذ Supabase SSR، و`proxy.ts`, و`requireAdmin()`, و`loginAction`, و`logoutAction`.
- **Completed** — إضافة `/admin/login`, `/admin/events/new`, و`/admin/events/[id]/edit` مع دورة `draft → published → archived` والاستعادة إلى `draft`.
- **Completed** — تحويل `/events`, `/admin`, `/admin/calendar`, و`/admin/events` إلى بيانات Supabase الحقيقية وإزالة `lib/demo/` من التشغيل.
- **Completed** — تحويل صفحات registrations, waitlist, interested, messages, وsurveys إلى حالات «غير مفعلة» دون سجلات تجريبية.
- **Completed** — فتح Draft PR رقم `#1` من `agent/phase-2-events` إلى `main` مع إبقاء النشر الإنتاجي يدويًا.
- **Completed** — إنشاء Auth user للمسؤول خارج Git، وإضافته إلى `admin_users`، والتحقق من تسجيل الدخول والخروج ودورة إنشاء فعالية ونشرها وأرشفتها.
- **In progress** — مراجعة Draft PR؛ لا يوجد تعديل تطبيقي نشط بعد نجاح الفحوص الحالية.

## قاعدة البيانات والأمان

| البند | الحالة | الدليل |
| --- | --- | --- |
| `events` schema | **Completed** | `supabase/migrations/20260803110421_phase_2_events.sql`. |
| RLS للعامة | **Completed** | الزائر يرى `published` القادمة فقط؛ اختبارات pgTAP رقم `1–3`. |
| RLS لغير المسؤول | **Completed** | لا يرى بيانات الإدارة ولا يكتب؛ اختبارات pgTAP رقم `4–6` و`8`. |
| صلاحيات المسؤول | **Completed** | create/update/status change؛ اختبارات pgTAP رقم `7`, `9–11`. |
| منع hard delete | **Completed** | لا grant ولا policy لـ`DELETE`؛ اختبارات pgTAP رقم `12–13`. |
| بيانات البداية | **Completed** | لا يوجد seed للفعاليات، واختبارات SQL تتراجع بالكامل. |
| إنشاء حساب المسؤول | **Completed** | أُنشئ Auth user خارج Git وأُضيف `user_id` إلى `admin_users`، دون حفظ البريد أو كلمة المرور في المستودع. |
| تعطيل signup في الإعداد المحلي | **Completed** | `supabase/config.toml` يحدد `enable_signup = false`. |
| تعطيل signup في المورد البعيد | **Completed** | تم تعطيله من Supabase Dashboard، ثم تحقق فحص القراءة البعيد من إرجاع `disable_signup: true`. |

## التطبيق والمسارات

| المسار أو الوحدة | الحالة | الوضع الحالي |
| --- | --- | --- |
| `/events` | **Completed** | dynamic، بلا fallback، ويعرض published upcoming فقط أو empty state. |
| `/admin/login` | **Completed** | email/password فقط، ورسائل عربية عامة دون كشف أخطاء Supabase. |
| `/admin` | **Completed** | محمي ويعرض مؤشرات حالات الفعاليات الحقيقية. |
| `/admin/calendar` | **Completed** | تقويم ميلادي عربي ببيانات Supabase وتوقيت `Asia/Riyadh`. |
| `/admin/events` | **Completed** | جدول السعة والتوفر والنشر وإجراءات الحالة. |
| `/admin/events/new` | **Completed** | تحقق خادمي وحفظ أولي كـ`draft`. |
| `/admin/events/[id]/edit` | **Completed** | تعديل الحقول المعتمدة دون تغيير النشر ضمن الحفظ. |
| `proxy.ts` | **Completed** | تحديث cookies واستدعاء `getClaims()` وتحويل غير المسجل. |
| `requireAdmin()` | **Completed** | يتحقق من claims و`admin_users` داخل الصفحات والإجراءات المحمية. |
| الصفحات المؤجلة إداريًا | **Completed** | تعرض «غير مفعلة» بدل بيانات demo. |

## التحقق

| الأمر أو الفحص | الحالة | النتيجة الحالية |
| --- | --- | --- |
| `pnpm lint` | **Completed** | نجح دون أخطاء. |
| `pnpm typecheck` | **Completed** | نجح `tsc --noEmit`. |
| `pnpm test` | **Completed** | نجحت `10` ملفات و`18` اختبارًا. |
| `pnpm build` | **Completed** | نجح Next.js production build؛ مسارات Supabase والإدارة dynamic. |
| `pnpm supabase db lint` | **Completed** | لا توجد أخطاء schema في `public`. |
| `pnpm supabase test db` | **Deferred** | أمر الاختبار المحلي يعتمد container runtime، وقد اختار المستخدم عدم تثبيته. تم تشغيل ملف pgTAP نفسه على قاعدة Supabase البعيدة عبر `psql` ونجحت الاختبارات `13/13`. |
| Database types generation | **Completed** | نجح `supabase gen types --project-id ... --schema public` بعد CLI login، وحُدّث `lib/supabase/database.types.ts` من المشروع البعيد دون Docker. |
| Browser public/admin login | **Completed** | `/events` وempty state وRTL سليمة؛ `/admin` يحول إلى `/admin/login`; لا overflow أو console/page errors. |
| Admin login success + CRUD browser flow | **Completed** | نجح login/logout وإنشاء `draft` ثم publish ثم archive، وظهر المنشور في `/events` واختفى بعد الأرشفة؛ حُذفت فعالية التحقق المؤقتة وأصبحت القاعدة فارغة. |

## الخطوات التالية

1. **Completed** — تعطيل remote signup من Supabase Dashboard والتحقق من `disable_signup: true`؛ حساب المسؤول و`admin_users` مكتملان.
2. **Completed** — تسجيل Supabase CLI وتوليد types من المشروع البعيد باستخدام `--project-id`؛ لم يُستخدم Docker.
3. **Deferred** — تشغيل `pnpm supabase test db` محليًا؛ اختار المستخدم عدم تثبيت container runtime، ونجح بديله البعيد عبر `psql` بنتيجة `13/13`.
4. **Completed** — فحص الدخول والخروج وإنشاء draft ثم publish ثم archive في المتصفح بالحساب المعتمد، ثم تنظيف سجل التحقق.
5. **Completed** — مراجعة الفرق، وإنشاء commit, وpush، وفتح Draft PR رقم `#1` من `agent/phase-2-events`.
6. **Deferred** — نشر الإنتاج يدويًا بعد مراجعة Draft PR؛ لا GitHub auto-deploy في هذه الدفعة.
7. **Deferred** — التسجيلات، وقائمة الانتظار، والاستبيانات المحفوظة، والرسائل، والتذكيرات، والبيانات الشخصية.
