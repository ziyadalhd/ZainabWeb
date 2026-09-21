-- Widens message_templates beyond the registration reminder so an
-- administrator can edit every manual WhatsApp message from the dashboard.
-- The existing 'registration_reminder' rows are left untouched.

alter table public.message_templates
  drop constraint if exists message_templates_kind_valid;

alter table public.message_templates
  add constraint message_templates_kind_valid
  check (kind in (
    'confirmation',
    'registration_reminder',
    'waitlist_invitation',
    'cancellation',
    'feedback_request'
  ));

comment on table public.message_templates is
  'Administrator-only editable message defaults and per-event overrides for the manual WhatsApp queue. Contains no delivery state or recipient data.';

-- Seed the global default for each newly editable kind, mirroring the
-- built-in copy the application falls back to. Existing rows win.
insert into public.message_templates (kind, event_id, body)
values (
  'confirmation',
  null,
  $template$يا هلا فيكِ {{attendee_name}}، 🤍
سعدنا جداً بانضمامك معنا في فعالية «{{event_title}}»!

يسعدنا تأكيد حضورك، أو إدارته والاعتذار في حال طرأ عليك ظرف، من خلال الرابط التالي:
{{management_url}}

ولإتمام تسجيلك بكل راحة، يمكنك التحويل مسبقاً على الحساب التالي:
رقم الآيبان:
SA75 8000 0201 6080 1626 0868

(ملاحظة: يمكنك إتمام التحويل البنكي، أو الدفع مباشرة عند وصولك للمقر).

نتطلع لتواجدك بفارغ الصبر! ✨$template$
)
on conflict (kind) where event_id is null do nothing;

insert into public.message_templates (kind, event_id, body)
values (
  'waitlist_invitation',
  null,
  $template$يا هلا {{attendee_name}} 🤍
عندنا خبر سعيد! توفر مقعد في فعالية «{{event_title}}» وحبينا نبدأ فيك.

الدعوة صالحة لمدة ٦ ساعات فقط، فبادري بقبولها من الرابط قبل ما تنتهي:
{{management_url}}

نتحمس نشوفك معنا! ✨$template$
)
on conflict (kind) where event_id is null do nothing;

insert into public.message_templates (kind, event_id, body)
values (
  'cancellation',
  null,
  $template$يا هلا {{attendee_name}} 🤍
نعتذر منك، أُلغيت فعالية {{event_title}} المقرر إقامتها في {{event_date}}.

نتمنى نشوفك في فعالياتنا القادمة، وراح نشاركك المواعيد الجديدة أول بأول عبر القنوات المعتمدة.

شكراً لتفهمك 🤍$template$
)
on conflict (kind) where event_id is null do nothing;

insert into public.message_templates (kind, event_id, body)
values (
  'feedback_request',
  null,
  $template$يا هلا {{attendee_name}} 🤍
كم سعدنا بحضورك فعالية «{{event_title}}» في نادي بَيْن الثقافي!

رأيك يهمنا كثير، ويساعدنا نطور فعالياتنا القادمة عشانك. شاركينا انطباعك من هنا:
{{management_url}}

شكراً من القلب لتواجدك معنا 🤍$template$
)
on conflict (kind) where event_id is null do nothing;
