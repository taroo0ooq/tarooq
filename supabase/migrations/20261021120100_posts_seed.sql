-- Existing posts from content/posts. Images stay in public/posts.
-- Re-applying this seed does not overwrite a row the owner has edited.

insert into public.posts (slug, title, description, body, lang, status, published_on, published_at, cover_path, cover_alt, seo_title, seo_description, linkedin_text, linkedin_mode, linkedin_status, linkedin_urn, linkedin_url)
values ($slug$2026-10-20-kubernetes-isnt-cloud$slug$, $title$Knowing Kubernetes isn't knowing the cloud$title$, $description$Kubernetes is one valuable skill on a cloud platform, but identity, networking, governance and cost are what make someone a cloud expert.$description$, $body$موظفك الجديد بيعرف Kubernetes من جوا لبرا. وبعدين بيوصل لعنده أول سؤال عن الـ identity أو الـ networking أو التكلفة. شو بيصير بعدها؟

في سوء فهم بسيط بشوفه كتير، إنه اللي بيعرف Kubernetes أو containers يعني بيعرف الـ cloud وصار خبير فيه، وهاد مو صحيح أبداً.

الـ Kubernetes هو service وحدة شغالة جوا منصة أكبر بكتير والـ cluster غالباً هو الجزء السهل. الجزء الصعب هو كل شي حواليه الـ landing zone اللي قاعد فيها ومين مالك الـ subscription وكيف الـ identity بتنزل من Entra ID والـ RBAC لحد الـ pods، وبعدين الـ Private Link والـ DNS والـ egress من خلال Azure Firewall، وتكلفة كل node pool ما حدا عمله scale down يوم الخميس.
فممكن تبني AKS نظيف ومرتب وتعلق بـ private DNS zone، أو Azure Policy بتمنع الـ public IP، أو فاتورة Log Analytics عم تكبر كل شهر لأنه كل container عم يكتب logs بأعلى مستوى.

طيب هل الـ Kubernetes مهارة مهمة؟ أكيد ومهمة كتير! بس هي مهارة وحدة على المنصة مو المنصة نفسها.

الـ containers بتقلك كيف التطبيق شغال. والـ cloud بيقلك وين عايش، ومين بيقدر يوصله، ومين بيدفع حقه.

إذا عم توظف لشغل cloud، شو السؤال اللي بتسأله وما بيقدر يجاوب عليه شخص كل خبرته Kubernetes؟$body$, $lang$ar$lang$, $status$published$status$, $day$2026-10-20$day$, $at$2026-10-20T00:00:00+03:00$at$, $cover$/posts/2026-10-20-kubernetes-isnt-cloud.png$cover$, $alt$Kubernetes containers at the center of a wider cloud platform with identity, network, firewall, policy, and cost.$alt$, $seo_title$$seo_title$, $seo_description$$seo_description$, $linkedin$موظفك الجديد بيعرف Kubernetes من جوا لبرا. وبعدين بيوصل لعنده أول سؤال عن الـ identity أو الـ networking أو التكلفة. شو بيصير بعدها؟

في سوء فهم بسيط بشوفه كتير، إنه اللي بيعرف Kubernetes أو containers يعني بيعرف الـ cloud وصار خبير فيه، وهاد مو صحيح أبداً.

الـ Kubernetes هو service وحدة شغالة جوا منصة أكبر بكتير والـ cluster غالباً هو الجزء السهل. الجزء الصعب هو كل شي حواليه الـ landing zone اللي قاعد فيها ومين مالك الـ subscription وكيف الـ identity بتنزل من Entra ID والـ RBAC لحد الـ pods، وبعدين الـ Private Link والـ DNS والـ egress من خلال Azure Firewall، وتكلفة كل node pool ما حدا عمله scale down يوم الخميس.
فممكن تبني AKS نظيف ومرتب وتعلق بـ private DNS zone، أو Azure Policy بتمنع الـ public IP، أو فاتورة Log Analytics عم تكبر كل شهر لأنه كل container عم يكتب logs بأعلى مستوى.

طيب هل الـ Kubernetes مهارة مهمة؟ أكيد ومهمة كتير! بس هي مهارة وحدة على المنصة مو المنصة نفسها.

الـ containers بتقلك كيف التطبيق شغال. والـ cloud بيقلك وين عايش، ومين بيقدر يوصله، ومين بيدفع حقه.

إذا عم توظف لشغل cloud، شو السؤال اللي بتسأله وما بيقدر يجاوب عليه شخص كل خبرته Kubernetes؟

https://alghazzi.org/posts/2026-10-20-kubernetes-isnt-cloud$linkedin$, $mode$both$mode$, $state$posted$state$, $urn$urn:li:share:7518440656445267968$urn$, $url$https://www.linkedin.com/feed/update/urn:li:share:7518440656445267968$url$)
on conflict (slug) do nothing;

insert into public.posts (slug, title, description, body, lang, status, published_on, published_at, cover_path, cover_alt, seo_title, seo_description, linkedin_text, linkedin_mode, linkedin_status, linkedin_urn, linkedin_url)
values ($slug$2026-10-21-syrias-digital-systems$slug$, $title$Syria's digital systems$title$, $description$Build Syria$description$, $body$Don't rebuild Syria's digital systems the way most of us built ours, one urgent project at a time with governance promised for phase two.

Since 2001 I've spent most of my career walking into platforms that were built fast and fixed later and the pattern is always the same, first the workloads go live then someone asks who owns the subscriptions and then the Entra ID cleanup starts and then the bill arrives and nobody can explain it. Every time.
Syria has a rare chance here because so much will be built new, and building new means you can put identity and landing zones and Azure Policy and data residency and FinOps ownership in place before the first ministry or bank or hospital system in Damascus or Aleppo goes live on Azure or AWS and not after. Here in Riyadh where I've lived for 16 years I watched the Kingdom put cloud and data rules in place through CST and NDMO while the platforms were being built, and Syria can learn a lot from that.

So my warning is simple. The pressure to show quick wins will be huge and it should be because people need services that work, but quick and governed are not opposites they just need someone to design both at the same time.

The platform you skip governing in year one becomes the migration project in year five.

If you're working on Syria's digital rebuild, what's the one foundation you'd refuse to skip?$body$, $lang$en$lang$, $status$published$status$, $day$2026-10-21$day$, $at$2026-10-21T00:00:00+03:00$at$, $cover$/posts/syrias-digital-systems.png$cover$, $alt$Build Syria$alt$, $seo_title$$seo_title$, $seo_description$$seo_description$, $linkedin$Don't rebuild Syria's digital systems the way most of us built ours, one urgent project at a time with governance promised for phase two.

Since 2001 I've spent most of my career walking into platforms that were built fast and fixed later and the pattern is always the same, first the workloads go live then someone asks who owns the subscriptions and then the Entra ID cleanup starts and then the bill arrives and nobody can explain it. Every time.
Syria has a rare chance here because so much will be built new, and building new means you can put identity and landing zones and Azure Policy and data residency and FinOps ownership in place before the first ministry or bank or hospital system in Damascus or Aleppo goes live on Azure or AWS and not after. Here in Riyadh where I've lived for 16 years I watched the Kingdom put cloud and data rules in place through CST and NDMO while the platforms were being built, and Syria can learn a lot from that.

So my warning is simple. The pressure to show quick wins will be huge and it should be because people need services that work, but quick and governed are not opposites they just need someone to design both at the same time.

The platform you skip governing in year one becomes the migration project in year five.

If you're working on Syria's digital rebuild, what's the one foundation you'd refuse to skip?

https://alghazzi.org/posts/2026-10-21-syrias-digital-systems$linkedin$, $mode$both$mode$, $state$posted$state$, $urn$urn:li:share:7518582242491707392$urn$, $url$https://www.linkedin.com/feed/update/urn:li:share:7518582242491707392$url$)
on conflict (slug) do nothing;

insert into private.linkedin_claims (post_id, state, urn, url)
select id, 'posted', linkedin_urn, linkedin_url
from public.posts
where slug in ($seedslug$2026-10-20-kubernetes-isnt-cloud$seedslug$, $seedslug$2026-10-21-syrias-digital-systems$seedslug$)
  and linkedin_urn <> ''
on conflict (post_id) do nothing;
