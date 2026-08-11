# خطة التنفيذ الحالية

آخر تحديث: `2026-08-09`

هذا الملف يعكس أدلة التنفيذ والتحقق الفعلية للفرع `codex/phase-3-bookings`. `ROADMAP.md` هو المرجع الأساسي لحالة المراحل وترتيبها، و`PLAN.md` هو المرجع لنطاق المنتج المعتمد. لا يعتبر العمل مكتملًا إذا بقي تحقق أو إجراء يدوي مطلوب.

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

## المرحلة الثالثة: الحجز والتواصل

| البند | الحالة | الوضع الفعلي |
| --- | --- | --- |
| فرع التنفيذ | **Completed** | أُنشئ `codex/phase-3-bookings` من حالة المرحلة الثانية المحلية. تعذر تحديث `origin/main` لأن `git fetch` توقف في البيئة، لذلك لا يُدّعى أنه مبني على أحدث remote commit. |
| ألوان الواجهة الدلالية | **Completed** | أضيفت tokens للأخضر الداكن، الأخضر، الأصفر، الكريمي، والأسطح والحالات في `app/globals.css`. اعتمد `public/brand/club-logo-on-green.svg` وربط بـ`ClubLogo`، ونجح التحقق البصري على سطح المكتب والجوال. |
| سعر الفعالية ونهايتها | **Completed** | أضيف `ends_at`, و`price_halalas`, وحد السعة 50 في migration وطُبقت على Supabase البعيد، ثم تحقق وجود الأعمدة والقيود مباشرة عبر Postgres. الفعاليات الثلاث القديمة تحتاج إكمال الحقلين من الإدارة؛ منها فعالية واحدة منشورة حاليًا وتظهر بقيم «غير محددة» إلى أن تُعدّل. |
| نموذج إدارة الفعالية | **Completed** | يدعم البداية والنهاية والسعر والسعة والتحكم المستقل في فتح أو إغلاق التسجيل، مع تحقق خادمي ورسائل عربية؛ الامتلاء مشتق ولا يكتبه المسؤول. |
| صفحة تفاصيل الفعالية | **Completed** | أضيف `/events/[id]` للفعالية المنشورة القادمة فقط، وتعرض الوقت والسعر والسعة المشتقة ونموذج التسجيل المناسب للفئة. |
| تقويم الإدارة | **In progress** | أضيف التنقل بين الشهر السابق والحالي والتالي، ويلزم التحقق البصري على الجوال وسطح المكتب. |
| التسجيل الفعلي | **Completed** | أضيف التسجيل للبالغات والصغار واليافعات، واسم ولي الأمر وعمر القاصر وموافقته، وسعر الحجز المحفوظ، ورابط إدارة آمن للتأكيد والإلغاء. |
| WhatsApp اليدوي | **Completed** | تجهز قائمة المسجلات رسالة `wa.me` فردية باسم المسجّلة والفعالية الحقيقيين ورابط إدارة آمن خاص بالحجز. يخزن النظام بصمة الرابط فقط، ويظل «مجهزًا» حتى يضغط المسؤول «تم الإرسال يدويًا». لا يوجد provider أو إرسال آلي. |
| الدفع | **Deferred** | السعر يحدده المالك ويُعرض للزائر؛ التحصيل في الموقع. لا بوابة دفع إلكتروني في هذه المرحلة. |
| قائمة الانتظار والاستبدال | **Completed** | السعة وقائمة الانتظار ذريتان، والاختيار يدوي وينشئ دعوة آمنة لمدة ست ساعات تقبلها المشاركة، ويمكن للمسؤول سحبها. لا توجد ترقية تلقائية. |
| تصدير سجلات الإدارة | **Completed** | أضيف `CSV` محمي للمسجلين الحاليين والسابقين وقائمة الانتظار. يطلب `requireAdmin()` قبل قراءة أي سجل، ويرفض النطاقات غير المعروفة، ويعيد رؤوس `no-store` ويعالج قيم الإدخال التي قد تنفذ كصيغ في تطبيقات الجداول. |
| تسجيل الحضور والغياب | **Completed** | أضيفت `check_in_status` و`checked_in_at` إلى التسجيلات في مشروع التطوير فقط. الحالتان المتاحتان للإجراء هما `checked_in` و`absent`، وتبقيان منفصلتين عن تأكيد المشاركة. تُفرض صلاحية المسؤول في wrapper عام محكوم ومساعد خاص ذي `search_path` ثابت. |
| طلبات حجز المساحة والحفلات والورش | **Completed** | نُفذت النماذج العامة بالحقول المعتمدة، والتحقق الخادمي، وتخزين الطلب الآمن، والرابط السري للمتابعة والإلغاء، وقائمة المسؤول وبدء المراجعة. اكتملت أيضًا صياغة عرض الحجز (السعر والشروط والصلاحية القابلة للتعديل)، قبول/رفض صاحبة الطلب بالرابط الآمن، تسجيل حالة الدفع يدويًا بعد القبول، وتحذير التداخل مع فعاليات وتقويم طلبات النادي. أضيف اختيار «فعالية النادي» أو «رحلة بَيْن» إلى نموذج الفعالية، وتستخدم `/bayn-trips` الفعاليات المنشورة القادمة المصنفة رحلة فقط؛ الفعاليات السابقة أخذت القيمة الآمنة `club_event` عبر migration أمامي. |

## تحقق المرحلة الثالثة

| الأمر أو الفحص | الحالة | النتيجة الحالية |
| --- | --- | --- |
| Remote migration inspection | **Completed** | تأكد وجود `ends_at`, `price_halalas`, وقيود `events_capacity_maximum`, `events_end_after_start`, و`events_price_non_negative`. |
| Remote pgTAP | **Completed** | نجحت اختبارات RLS والقيود `16/16` على القاعدة المرتبطة ثم نُفذ `ROLLBACK`. عُزلت fixtures عن الفعاليات الثلاث الموجودة فعليًا. |
| `pnpm supabase db lint --linked --schema public` | **Completed** | نجح دون أخطاء schema. |
| Database types generation | **Completed** | نجح `pnpm supabase gen types typescript --project-id ... --schema public` وتطابقت الأنواع المحلية مع schema البعيد. |
| Registration migration | **Completed** | نجح اختبار migration داخل transaction ثم طُبقت `20260805122606_phase_3_registrations.sql` على المشروع المرتبط. يتضمن RLS وRPC وSupabase Cron للحذف بعد 90 يومًا. |
| Development Supabase project | **Completed** | أُنشئ مشروع تطوير مستضاف منفصل على الخطة المجانية في `ap-south-1` بعد تأكيد تكلفة `$0/month`. Vercel Preview فقط يستخدم عنوانه ومفتاح النشر عبر overrides خاصة بـPreview؛ لم تتغير Production أو Development. |
| Registration remote pgTAP | **Completed** | نجحت `47/47` حالة على مشروع التطوير المنفصل، ونجحت اختبارات الأحداث `16/16`. غطت القاصرات والسعر المحفوظ والسعة المشتقة والدعوات والقبول والسحب والانتهاء وروابط الحجز والإلغاء وRLS. |
| `pnpm supabase db lint --linked --schema public` بعد التسجيل | **Completed** | نجح دون أخطاء schema بعد تطبيق التسجيل وCron. |
| Supabase advisors | **Completed** | لا توجد ملاحظات أمنية بعد نقل التنفيذ المميز إلى `private` خلف wrappers عامة `security invoker`. بقي تنبيه أداء معلوماتي واحد عن index غير مستخدم، وهو متوقع في قاعدة التطوير الفارغة. |
| Registration domain smoke check | **Completed** | نجح توحيد الجوال السعودي والتحقق الأساسي باستخدام Node type stripping. |
| Registration TS/TSX syntax check | **Completed** | نجح تحويل ملفات التسجيل والشعار الجديدة عبر `esbuild` الموجود محليًا دون أخطاء syntax. لا يحل هذا محل `typecheck`. |
| `pnpm typecheck` | **Completed** | نجح `tsc --noEmit` بعد النقل وإزالة نسخة matcher المتعارضة التي أنشأها iCloud. |
| ESLint | **Completed** | نجح `pnpm lint` دون أخطاء بعد إصلاح نقاء `AdminOverview` ونقل قراءة الساعة خارج render. |
| Vitest | **Completed** | نجحت `15` ملفات و`33/33` اختبارًا، ومنها نماذج الفعالية والتسجيل وإجراءات الحجز والدعوة الآمنة. |
| `pnpm build` | **Completed** | نجح Next.js `16.2.12` production build باستخدام Node `24.14.0` arm64؛ مسارات الحجز والدعوات dynamic. |
| Protected CSV export | **Completed** | نجح `lint` و`typecheck` و`39/39` اختبارًا، منها اختبار أن حماية المسؤول تسبق قراءة البيانات، ثم نجح `pnpm build` مع مسار `/admin/registrations/export` الديناميكي. |
| Check-in development migration | **Completed** | طُبقت migrations الأمامية `20260809195337` و`20260809200011` على مشروع Supabase التطوير فقط. نجح اختبار داخل transaction متراجعة: رُفض غير المسؤول، وسجل المسؤول `checked_in` مع طابع زمني من دون تغيير `attendance_status`. أضيفت ست حالات pgTAP إلى الملف المحلي (الإجمالي `53`)؛ لم تشغّل محليًا لأن container runtime مؤجل. |
| Browser review | **Completed للنطاق العام** | نجح مسار التسجيل لليافعات، وتحول السعة المشتقة إلى قائمة انتظار، وتأكيد الحضور، وإلغاء الحجز ثنائي الخطوة مع صفحة نجاح، وقبول دعوة الانتظار مع صفحة نجاح. روجعت واجهة RTL على `1280px` و`390px` دون overflow أو أخطاء صفحة. حُضر حساب مسؤول منفصل في مشروع التطوير دون حفظ بياناته الشخصية في المستودع؛ قبول الصفحات الإدارية بالحساب ما زال مطلوبًا. |
| Development admin recovery | **In progress** | أُضيف رابط Preview إلى إعدادات Auth في مشروع التطوير بعد أن كان رابط الاستعادة يتجه إلى `localhost`. تأكدت سجلات Auth من نجاح الإعداد، لكن مزود البريد المجاني في Supabase بلغ حد رسالتين في الساعة؛ يجب إرسال رسالة استعادة واحدة جديدة بعد انتهاء المهلة ثم إكمال قبول لوحة الإدارة. |
| Admin password-recovery route | **Completed** | أضيف `/admin/reset-password` كمسار عام محدود يستقبل جلسة الاستعادة المؤقتة فقط، ويعيد تعيين كلمة المرور من المتصفح ثم يلغي الجلسات ويحوّل إلى دخول المسؤول. أضيف زر داخل `/admin/login` يرسل الرابط إلى هذا المسار نفسه. لا يمرر كلمة المرور أو البريد إلى Server Action ولا يسجلهما. يبقى `Site URL` مطلوبًا فقط للرسائل المرسلة من Dashboard. |
| Service-request remote verification | **Completed** | تحقق اختبار Supabase داخل transaction متراجعة على مشروع التطوير: المستخدم العام يرسل طلبًا محدودًا ويقرأه برابطه السري فقط، والمسؤول المعتمد يبدأ المراجعة وينشئ عرضًا نشطًا. لم تبق بيانات اختبار في القاعدة. |
| Manual reminder links | **Completed** | طُبقت migrations `20260811091535_registration_manual_reminders.sql` و`20260811094242_invalidate_reminders_on_cancellation.sql` على مشروع Supabase التطوير فقط. نجحت 17 حالة pgTAP داخل معاملة متراجعة، وتشمل إصدار رابط فردي، وفتح الحجز نفسه، والتأكيد والإلغاء به، وإبطال جميع الروابط عند إلغاء المشاركة أو المسؤول. واختبار المتصفح بحساب وسجل اصطناعيين أثبت ظهور الاسم والفعالية والرابط الصحيح، والتأكيد الفوري لحالة الإرسال وبقاءها بعد إعادة التحميل، وعدم تجاوز الصفحة أفقيًا عند `390px`؛ ثم حُذفت fixtures بالكامل. |
| Service-request offer operations | **Completed** | طُبقت migration `20260811112404_service_request_offer_operations.sql` على مشروع Supabase التطوير فقط. غطى اختبار pgTAP داخل transaction متراجعة 14 حالة: صلاحيات القراءة، الإرسال الآمن، الإلغاء والاحتفاظ، العرض، تداخل طلبين، قبول العرض بالرابط، وتسجيل العربون يدويًا؛ ثم تحقق استعلام مستقل من عدم بقاء fixtures. نجح `lint` و`typecheck` وVitest (`50/50`) وproduction build. |
| Event feedback, posters, and site settings | **Completed in development** | طُبقت migrations `20260811123752_event_feedback_and_posters.sql` و`20260811125103_site_content_settings.sql` على مشروع Supabase التطوير فقط. روابط التقييم تحفظ hash فقط وتنفذ الاستجابة الواحدة مع فصل هوية المشاركة عند الاختيار المجهول؛ bucket البوسترات عام للقراءة لكنه يقيّد الرفع والحذف للمسؤول المعتمد. نُفذت إعدادات المحتوى والمقر والتواصل والشريك الأدبي بلوحة الإدارة، ونجحت اختبارات pgTAP (`12/12` و`5/5`) داخل معاملات متراجعة. |
| Interested contacts and event payments | **Completed in development** | طُبقت migration `20260811130331_interested_contacts_and_event_payments.sql` على مشروع Supabase التطوير فقط. يسجل نموذج المهتمات الاسم والجوال السعودي والبريد الإلكتروني الإلزامي بعد موافقة صريحة، ويحفظ فقط SHA-256 لرابط الإلغاء الآمن. سجل دفع الفعالية يدوي ومستقل بالحالات المعتمدة الثلاث. نجحت 11 حالة pgTAP داخل معاملة متراجعة، ومنها RLS للمعلومات الشخصية، الإلغاء الآمن، وصلاحية المسؤول للدفع؛ وتأكد عدم بقاء fixtures. |

## فرع مقارنة التصميم

| البند | الحالة | الوضع الفعلي |
| --- | --- | --- |
| فرع التصميم | **In Progress** | يجري تحديث الواجهات العامة والإدارية على `codex/design-refresh` فقط، مع بقاء النسخة المعتمدة على `codex/phase-3-bookings` ودون دمج أو نشر إنتاجي. |
| نظام الهوية | **Completed** | ثُبتت الألوان الأربع الدقيقة `#FFF1CA`, `#FFB623`, `#708A58`, و`#204F28` كـtokens دلالية، واستُخدم الشعار الرسمي `public/brand/club-logo-on-green.svg` دون تعديل نسبه أو مساراته. |
| الاتجاه البصري | **Completed** | أصبحت الواجهة العامة تحريرية دافئة، ولوحة الإدارة تشغيلية كثيفة وواضحة، واعتمد تقاطع الحقول الأربعة كتوقيع بصري واحد في الصفحة الرئيسية فقط. |
| الاستجابة والوصولية | **In Progress** | أضيفت حالات تركيز ظاهرة، رابط تخطي، أهداف لمس مناسبة، قائمة جوال قابلة للتمرير والإغلاق بـEscape، وجداول بتمرير محصور، مع تحويل تقويم الإدارة إلى قائمة أيام على الجوال. نجحت معاينة دخول الإدارة عند `320×568`, `375×667`, `390×844`, `430×932`, `768×1024`, `1024×768`, و`1440×900` دون overflow، ونجحت حالة رابط الاستعادة غير الصالح عند `375×667`؛ تبقى مراجعة المسارات المتصلة بـSupabase على Preview. |
| تحقق الشيفرة | **Completed** | نجح `pnpm lint` و`pnpm typecheck` و`pnpm test` (`57/57`) و`pnpm build` على Next.js `16.2.12`. لم تتغير migrations أو مخططات Supabase أو قواعد المصادقة أو RLS أو سلوك الأعمال. |

### مراجعة توافق قواعد التسجيل بعد التثبيت

أُغلقت الفجوات الأربع بمigrations أمامية منفصلة واختبارات SQL/RLS على مشروع Supabase التطوير المجاني. لم تُعدّل أي migration سبق تطبيقها:

| الفجوة | الحالة | التصحيح المطلوب |
| --- | --- | --- |
| فتح التسجيل والسعة | **Completed** | استُبدلت `availability` بتحكم `registration_status`، وأصبحت حالة الامتلاء مشتقة من الحجوزات المسجلة والدعوات غير المنتهية. |
| تسجيل القاصرات | **Completed** | يدعم الصغار 6–12 واليافعات 13–17 مع العمر واسم ولي الأمر والجوال السعودي والموافقة الصريحة، وتسمح القاعدة لولي الأمر بتسجيل أكثر من قاصر بأسماء مختلفة. |
| دعوة قائمة الانتظار | **Completed** | الاختيار اليدوي ينشئ `invited` لست ساعات؛ القبول آمن، والسحب اليدوي والانتهاء الزمني منفذان، ولا توجد ترقية تلقائية. |
| رابط إدارة الحجز | **Completed** | يولد التطبيق token عشوائيًا من 32 بايت، ولا يحفظ إلا SHA-256 hash؛ الرابط لا يتضمن بيانات شخصية ويبطل بعد الإلغاء أو انتهاء الفعالية. |

طُبقت migrations التصحيحية واختباراتها على مشروع التطوير فقط. لم تُطبق بعد على القاعدة الحالية المرتبطة بـVercel. استُبدلت فقط متغيرات Supabase العامة في Preview بمتغيرات مشروع التطوير؛ لم تتغير Production أو Development.

## تثبيت المشروع وخطة الإنتاج: 2026-08-09

بعد تدقيق المستودع ومقابلة المنتج، تم اعتماد `PLAN.md` و`ROADMAP.md` لتغطية التسجيل، الحضور، الانتظار، الطلبات، البريد، WhatsApp اليدوي، الاستبيانات، إدارة المحتوى، الحماية، والمراقبة.

| البند | الحالة | الدليل الحالي |
| --- | --- | --- |
| Node runtime | **In progress** | أضيف `.nvmrc` واعتمد Node 24. نجحت جميع الفحوص داخل Codex باستخدام Node `24.14.0` arm64 و`pnpm@11.9.0`، لكن Terminal النظام ما زال يبدأ افتراضيًا على Node `22.11.0` إلى أن يفعّل المستخدم Node 24 عبر مدير النسخ. |
| TypeScript library target | **Completed** | استبدل `esnext` بـ`es2024` المستقر، ونجح `typecheck` وproduction build النهائي بهذا الإعداد. |
| iCloud diagnosis | **Completed** | أكد `stat` أن ملفات من `node_modules` و`app/` كانت `compressed,dataless` داخل `Documents`، وأكد `lsof` أن أدوات Node تنتظر عمليات `read` عليها. |
| Dependency storage | **Completed** | أعيد `pnpm install --frozen-lockfile` بتخطيط قياسي؛ `virtualStoreDir` هو `node_modules/.pnpm` وcontent store هو pnpm store المعتاد. أزيل symlink المؤقت فقط، وبقي cache القديم خارج المستودع دون حذف. |
| Repository location | **Completed** | نُقل المستودع خارج `Documents` وأعيد فتحه في Codex دون فقد التغييرات. |
| `pnpm typecheck` | **Completed** | نجح خلال ثوانٍ بعد إزالة نسخة iCloud المتعارضة وعودة تخطيط pnpm القياسي. |
| `pnpm test` | **Completed** | نجحت `15` suites و`33/33` اختبارًا بعد إغلاق فجوات التسجيل. |
| `pnpm lint` | **Completed** | نجح دون أخطاء. |
| `pnpm build` | **Completed** | نجح production build النهائي على Next.js `16.2.12`. |
| Documentation baseline | **Completed** | روجعت ووحّدت `README.md`, `PLAN.md`, `ROADMAP.md`, `AGENTS.md`، ووثائق `docs/` بعد النقل والفحوص. |

### الخطوة التالية المباشرة

1. **Completed** — نقل المستودع خارج `Documents` مع الحفاظ على التغييرات غير المحفوظة.
2. **Completed داخل Codex** — تشغيل Node 24 arm64 و`pnpm@11.9.0` وإعادة `pnpm install --frozen-lockfile` بتخطيط قياسي. يبقى تفعيل Node 24 في Terminal المستخدم إجراءً محليًا.
3. **Completed** — إزالة symlink المؤقت ونسخ تعارض iCloud، وإعادة فحص matcher types دون workarounds.
4. **Completed** — نجاح lint وtypecheck والاختبارات وbuild، ونجاح pgTAP (`16/16` و`47/47`) وSupabase security advisors على مشروع التطوير المنفصل.
5. **In progress** — رُبط Preview بمشروع التطوير مع إبقاء Production وDevelopment دون تغيير، وجُهز حساب مسؤول تطويري منفصل. أضيف رابط Preview إلى إعدادات Auth للتطوير؛ تبقى رسالة استعادة واحدة بعد انتهاء حد البريد المجاني ثم قبول صفحات الإدارة بهذا الحساب.
