# AutoScribe - Proje Bağlamı ve Geliştirme Planı (AI Context)

## 1. Proje Özeti
- **Proje Adı:** AutoScribe
- **Türü:** Visual Studio Code Eklentisi (VS Code Extension)
- **Amaç:** Kullanıcıların notlarını ve çalışma alanlarını otomatik olarak yedeklemelerini sağlayan açık kaynaklı bir araç.
- **Hedef:** Kişisel GitHub hesabı üzerinden herkese açık (public open-source) olarak yayınlanması.

## 2. Geliştirme Ortamı ve İzolasyon Kuralları (ÖNEMLİ)
- **Ortam:** Windows, Node.js/npm.
- **Dil:** TypeScript / VS Code Extension API.
- **Güvenlik ve İzolasyon:** Bu proje, geliştiricinin kurumsal/şirket çalışma ortamından **kesinlikle izole** edilmiştir. 
  - Şirkete ait global Git ayarları bu projeye etki etmemelidir.
  - Özel SSH anahtarı (`~/.ssh/github_noyan`) kullanılarak GitHub ile bağlantı kurulmuştur.
  - SSH komutu yerel olarak `git config core.sshCommand "ssh -i ~/.ssh/github_noyan"` şeklinde yapılandırılmıştır.
  - *AI için Not:* Önereceğin Git komutlarında veya otomasyonlarında global ayarları değiştirecek hiçbir adım sunma, her zaman proje bazlı (local) konfigürasyonları baz al.

## 3. Mevcut Durum (Tamamlananlar)
- `yo code` kullanılarak eklenti iskeleti (scaffold) oluşturuldu.
- Kurumsal Git çakışmalarını önlemek adına VS Code ayarları yapılandırıldı.
- İlk commit atıldı ve proje iskeleti GitHub'daki `main` dalına (branch) başarıyla pushlandı.
- Hatalı oluşan sanal klasörler (`~` dizini vb.) temizlendi, proje dizini tertemiz durumda.

## 4. Temel Özellikler (MVP - Planlananlar)
1. **Dinleme Mekanizması:** Belirlenen bir not klasöründeki veya aktif çalışma alanındaki değişikliklerin algılanması.
2. **Otomatik Yedekleme:** Dosya kaydedildiğinde (`onDidSaveTextDocument`) veya belirli zaman aralıklarında yedekleme işleminin tetiklenmesi.
3. **Kullanıcı Geri Bildirimi:** VS Code durum çubuğunda (Status Bar) yedekleme durumunun (Başarılı/Hata/Bekleniyor) gösterilmesi.
4. **Ayarlar:** `package.json` üzerinden kullanıcıya yedekleme sıklığı, hedef klasör gibi konfigürasyon seçenekleri sunulması.

## 5. Sonraki Adımlar (AI'dan Beklenenler)
- `extension.ts` dosyasının temizlenip, ana yedekleme döngüsünün tasarlanması.
- Kullanıcı ayarlarının (settings) eklentiye entegre edilmesi.
- Yedekleme (Git commit/push veya dosya kopyalama) mantığının fonksiyonlara dökülmesi.