const mockData = {
    clients: [
        { id: 101, name: "Ahmet Yılmaz", phone: "555-123-4567", email: "ahmet@example.com", status: "Aktif", cases: [201, 202] },
        { id: 102, name: "Ayşe Kaya", phone: "555-987-6543", email: "ayse@example.com", status: "Beklemede", cases: [203] },
        { id: 103, name: "Mehmet Demir", phone: "555-456-7890", email: "mehmet@example.com", status: "Aktif", cases: [] },
        { id: 104, name: "Zeynep Çelik", phone: "555-321-6549", email: "zeynep@example.com", status: "Arşiv", cases: [204] }
    ],
    cases: [
        { id: 201, clientId: 101, title: "Yılmaz Boşanma Davası", type: "Aile Hukuku", court: "2. Aile Mahkemesi", status: "Açık", nextHearing: "2026-03-15", notes: "Tanıklar dinlenecek." },
        { id: 202, clientId: 101, title: "Alacak Tahsili", type: "İcra Hukuku", court: "4. İcra Dairesi", status: "İşlemde", nextHearing: "2026-02-28", notes: "Ödeme emri gönderildi." },
        { id: 203, clientId: 102, title: "Kaya Arazi Anlaşmazlığı", type: "Eşya Hukuku", court: "1. Asliye Hukuk", status: "Bilirkişide", nextHearing: "2026-04-10", notes: "Keşif yapılacak." },
        { id: 204, clientId: 104, title: "Tazminat Davası", type: "İş Hukuku", court: "3. İş Mahkemesi", status: "Kapalı", nextHearing: null, notes: "Karar kesinleşti." }
    ],
    activityLog: [
        { id: 1, text: "Ahmet Yılmaz dosyasına yeni evrak eklendi.", time: "10 dk önce", icon: "fa-file-alt" },
        { id: 2, text: "Yarınki duruşma hatırlatması: 2. Aile Mahkemesi", time: "1 saat önce", icon: "fa-bell" },
        { id: 3, text: "Ayşe Kaya ile görüşme notu Eklendi.", time: "3 saat önce", icon: "fa-sticky-note" },
        { id: 4, text: "Yeni müvekkil kaydı: Mehmet Demir", time: "Dün", icon: "fa-user-plus" }
    ],
    legislation: [
        {
            id: 1,
            code: "TCK",
            number: "5237",
            name: "Türk Ceza Kanunu",
            description: "Suç ve ceza politikası esaslarını belirleyen kanun.",
            details: {
                header: {
                    title: "T.C. CUMHURBAŞKANLIĞI",
                    subtitle: "MEVZUAT BİLGİ SİSTEMİ",
                    ministry: "Hukuk ve Mevzuat Genel Müdürlüğü"
                },
                meta: {
                    date: "12.10.2004",
                    number: "25611"
                },
                footer: {
                    address: "T.C. Cumhurbaşkanlığı Külliyesi 06560 Beştepe / Ankara",
                    contact: "Bize Ulaşın",
                    copyright: "2020 Tüm Hakları Saklıdır."
                }
            },
            articles: [
                { id: "1", number: "1", title: "Kanunun Amacı", content: "Ceza Kanununun amacı; kişi hak ve özgürlüklerini, kamu düzen ve güvenliğini, hukuk devletini, kamu sağlığını ve çevreyi, toplum barışını korumak, suç işlenmesini önlemektir." },
                { id: "2", number: "2", title: "Suçta ve Cezada Kanunilik İlkesi", content: "Kanunun açıkça suç saymadığı bir fiil için kimseye ceza verilemez ve güvenlik tedbiri uygulanamaz." },
                { id: "53", number: "53", title: "Belli Hakları Kullanmaktan Yoksun Bırakılma", content: "Kişi, kasten işlemiş olduğu suçtan dolayı hapis cezasına mahkûmiyetin kanuni sonucu olarak; sürekli, süreli veya geçici bir kamu görevinin üstlenilmesinden yoksun bırakılır." },
                { id: "81", number: "81", title: "Kasten Öldürme", content: "Bir insanı kasten öldüren kişi, müebbet hapis cezası ile cezalandırılır." },
                { id: "86", number: "86", title: "Kasten Yaralama", content: "Kasten başkasının vücuduna acı veren veya sağlığının ya da algılama yeteneğinin bozulmasına neden olan kişi, bir yıldan üç yıla kadar hapis cezası ile cezalandırılır." },
                { id: "102", number: "102", title: "Cinsel Saldırı", content: "Cinsel davranışlarla bir kimsenin vücut dokunulmazlığını ihlal eden kişi, mağdurun şikayeti üzerine, beş yıldan on yıla kadar hapis cezası ile cezalandırılır." },
                { id: "106", number: "106", title: "Tehdit", content: "Bir başkasını, kendisinin veya yakınının hayatına, vücut veya cinsel dokunulmazlığına yönelik bir saldırı gerçekleştireceğinden bahisle tehdit eden kişi, altı aydan iki yıla kadar hapis cezası ile cezalandırılır." },
                { id: "125", number: "125", title: "Hakaret", content: "Bir kimseye onur, şeref ve saygınlığını rencide edebilecek nitelikte somut bir fiil veya olgu isnat eden (...) kişi, üç aydan iki yıla kadar hapis veya adlî para cezası ile cezalandırılır." },
                { id: "141", number: "141", title: "Hırsızlık", content: "Zilyedinin rızası olmadan başkasına ait taşınır bir malı, kendisine veya başkasına bir yarar sağlamak maksadıyla bulunduğu yerden alan kimseye bir yıldan üç yıla kadar hapis cezası verilir." },
                { id: "157", number: "157", title: "Dolandırıcılık", content: "Hileli davranışlarla bir kimseyi aldatıp, onun veya başkasının zararına olarak, kendisine veya başkasına bir yarar sağlayan kişiye bir yıldan beş yıla kadar hapis ve beşbin güne kadar adlî para cezası verilir." },
                { id: "191", number: "191", title: "Uyuşturucu Madde Kullanma", content: "Kullanmak için uyuşturucu veya uyarıcı madde satın alan, kabul eden veya bulunduran ya da uyuşturucu veya uyarıcı madde kullanan kişi, iki yıldan beş yıla kadar hapis cezası ile cezalandırılır." }
            ]
        },
        {
            id: 2,
            code: "TBK",
            number: "6098",
            name: "Türk Borçlar Kanunu",
            description: "Borç ilişkilerini düzenleyen temel kanun.",
            articles: [
                { id: "1", number: "1", title: "Sözleşmenin Kurulması", content: "Sözleşme, tarafların iradelerini karşılıklı ve birbirine uygun olarak açıklamalarıyla kurulur." },
                { id: "2", number: "2", title: "İkinci Derecedeki Noktalar", content: "Taraflar sözleşmenin esaslı noktalarında uyuşmuşlarsa, ikinci derecedeki noktalar üzerinde durulmamış olsa bile, sözleşme kurulmuş sayılır." },
                { id: "49", number: "49", title: "Haksız Fiil", content: "Kusurlu ve hukuka aykırı bir fiille başkasına zarar veren, bu zararı gidermekle yükümlüdür." },
                { id: "117", number: "117", title: "Temerrüt", content: "Muaccel bir borcun borçlusu, alacaklının ihtarıyla temerrüde düşer." }
            ]
        },
        {
            id: 3,
            code: "TMK",
            number: "4721",
            name: "Türk Medeni Kanunu",
            description: "Kişiler, aile, miras ve eşya hukukunu kapsar.",
            articles: [
                { id: "1", number: "1", title: "Kanunun Uygulanması", content: "Kanun, sözüyle ve özüyle değindiği bütün konularda uygulanır." },
                { id: "2", number: "2", title: "Dürüst Davranma", content: "Herkes, haklarını kullanırken ve borçlarını yerine getirirken dürüstlük kurallarına uymak zorundadır." },
                { id: "166", number: "166", title: "Evlilik Birliğinin Sarsılması", content: "Evlilik birliği, ortak hayatı sürdürmeleri kendilerinden beklenmeyecek derecede temelinden sarsılmış olursa, eşlerden her biri boşanma davası açabilir." }
            ]
        }
    ]
};
