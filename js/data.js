/**
 * SIT BINA INSAN PAREPARE
 * Data Repository: Informasi Sekolah, Profil Jenjang, Berita, Testimoni, FAQ & SPMB
 */

const SchoolData = {
  profile: {
    name: "SIT Bina Insan Parepare",
    tagline: "Membentuk Generasi Qur'ani, Cerdas, Mandiri, dan Berakhlak Mulia",
    subTagline: "Sekolah Islam Terpadu Unggulan di Kota Parepare, Sulawesi Selatan",
    foundation: "Yayasan Bina Insan Parepare",
    accreditation: "Terakreditasi A (Unggul)",
    address: "Jl. Jend. Sudirman No 44 A, Kec. Bacukiki Barat, Kota Parepare, Prov. Sulawesi Selatan",
    googleMapsUrl: "https://maps.google.com/?q=Jl.+Jend.+Sudirman+No+44+A+Parepare",
    phone: "+62851-9061-0569",
    whatsapp: "+62851-9061-0569",
    whatsappHelpdesk: "6285190610569",
    email: "info@sitbinainsanparepare.sch.id",
    spmbEmail: "spmb@sitbinainsanparepare.sch.id",
    stats: {
      totalStudents: "1.250+",
      tahfizhAlumni: "420+",
      certifiedTeachers: "85+",
      nationalAwards: "64+"
    },
    socials: {
      facebook: "https://facebook.com/sitbinainsanparepare",
      instagram: "https://instagram.com/sitbinainsanparepare",
      youtube: "https://youtube.com/@sitbinainsanparepare",
      tiktok: "https://tiktok.com/@sitbinainsanparepare"
    }
  },

  levels: {
    tkit: {
      id: "tkit",
      badge: "Pendidikan Usia Dini Islam Terpadu (Usia 4–6 Tahun)",
      name: "TKIT Bina Insan Parepare",
      fullName: "Taman Kanak-kanak Islam Terpadu Bina Insan",
      heroImage: "/assets/images/tkit_activity.jpg?v=2",
      accentColor: "#2563eb",
      tagline: "Tumbuh dalam Iman, Ilmu, Karakter, dan Kemandirian",
      description: "TKIT Bina Insan Parepare mendampingi anak bertumbuh secara utuh melalui pendidikan yang mengembangkan keimanan, akhlak, pengetahuan, karakter, dan kemandirian. Anak dipersiapkan sejak dini menjadi pribadi yang sholeh, muslih, berilmu, percaya diri, serta mampu memberi kebaikan bagi lingkungan di sekitarnya dengan berlandaskan Al-Qur’an dan Sunah Rasul. Proses belajar dirancang dekat dengan dunia anak: aman, menyenangkan, bermakna, dan memberi ruang bagi setiap anak untuk bereksplorasi, mencoba, berkomunikasi, dan belajar bertanggung jawab sesuai tahap perkembangannya.",
      vision: "Mendampingi anak bertumbuh secara utuh berlandaskan Al-Qur'an dan Sunnah Rasul menjadi pribadi yang sholeh, muslih, berilmu, percaya diri, mandiri, dan berakhlak mulia.",
      curriculumTitle: "Kurikulum & Keunggulan TKIT",
      curriculumSubtitle: "Pembelajaran yang bermakna, menggembirakan, dan sesuai dunia anak.",
      keyPrograms: [
        {
          title: "01. Bermain Bermakna & Pembelajaran Mendalam",
          desc: "Anak belajar dengan cara yang alami melalui pengamatan, eksplorasi, pengalaman langsung, praktik, dan refleksi sederhana. Pembelajaran dirancang berkesadaran, bermakna, dan menggembirakan."
        },
        {
          title: "02. Al-Qur’an, Ibadah & Akhlak",
          desc: "Anak dibiasakan mencintai Allah melalui shalat dhuha, mengaji, doa harian, hafalan surat dan hadits pendek, serta pembentukan akhlak mulia melalui keteladanan dalam kegiatan sehari-hari."
        },
        {
          title: "03. Pengembangan Holistik & Kemandirian",
          desc: "Nilai agama dan moral, fisik-motorik, kognitif, bahasa, sosial-emosional, dan seni dikembangkan secara terintegrasi. Anak juga dilatih makan sendiri, merapikan barang, bertanggung jawab, dan berani mencoba."
        },
        {
          title: "04. Projek Kontekstual & Kolaboratif",
          desc: "Anak belajar melalui projek yang dekat dengan kehidupan nyata, memanfaatkan kelas, lingkungan sekolah, keluarga, dan masyarakat sebagai sumber belajar serta melatih kerja sama dan kepedulian."
        },
        {
          title: "05. Bahasa & Budaya Bugis",
          desc: "Pembelajaran mengenalkan kosakata Bahasa Bugis, nilai Sipakalebbi, dan permainan tradisional secara sederhana dan menyenangkan untuk menumbuhkan kecintaan terhadap budaya lokal."
        },
        {
          title: "06. 7 Kebiasaan Anak Indonesia Hebat",
          desc: "Sekolah membiasakan bangun pagi, beribadah, berolahraga, makan sehat dan bergizi, gemar belajar, bermasyarakat, dan tidur cepat melalui kerja sama sekolah dan orang tua."
        }
      ],
      facilitiesTitle: "Fasilitas Pendukung TKIT",
      facilitiesSubtitle: "Lingkungan belajar yang aman, nyaman, dan mendukung tumbuh kembang anak.",
      facilitiesDesc: "Fasilitas sekolah dirancang untuk mendukung kegiatan belajar, bermain, ibadah, literasi, eksplorasi sensorik, serta kebutuhan tumbuh kembang anak.",
      facilities: [
        "Ruang Kelas Ber-AC & Ramah Anak",
        "Taman Bermain Outdoor Edukatif",
        "Perpustakaan Sekolah",
        "Ruang Usaha Kesehatan Sekolah (UKS)",
        "Lapangan dan Sarana Aktivitas Olahraga",
        "Ruang Rapat dan Koordinasi Sekolah",
        "Fasilitas Sanitasi dan Toilet"
      ],
      spmbFee: "Rp 200.000",
      ageRequirement: "Pendidikan usia dini Islam terpadu untuk anak usia 4–6 tahun (TK-A & TK-B)"
    },

    sdit: {
      id: "sdit",
      badge: "Pendidikan Dasar (Kelas 1 - 6)",
      name: "SDIT Bina Insan Parepare",
      fullName: "Sekolah Dasar Islam Terpadu Bina Insan",
      heroImage: "/assets/images/sdit_recitation.jpg?v=2",
      accentColor: "#002f9b",
      tagline: "Cinta Al-Qur’an, Hafiz, Akademik, Soft Skill, Melek Teknologi, Bahasa Asing",
      description: "Sekolah Dasar Islam Terpadu Bina Insan Parepare berkomitmen untuk mewujudkan Generasi Rabbani yang berkarakter kuat, berilmu, serta siap mengemban peran sebagai Imamul Muttaqin (Pemimpin yang Beriman dan Bertakwa) dan aktif memakmurkan bumi melalui nilai- nilai keislaman dan penguasaan teknologi.",
      vision: "Menciptakan pengalaman belajar yang aktif, mendalam, bermakna, sekaligus menguatkan Murid bahwa ilmu pengetahuan merupakan bagian dari tanda-tanda kebesaran Allah SWT.",
      keyPrograms: [
        {
          title: "01. Pendekatan Pembelajaran ADLX TERPADU (Fase B dan C)",
          desc: "Active Deep Learning Experience (ADLX) diterapkan untuk menghadirkan pengalaman belajar yang membuat Murid aktif mengalami, mengeksplorasi, memahami, mengolah, dan menerapkan pengetahuan."
        },
        {
          title: "02. Al-Qur’an Metode Ilman Waruuhan",
          desc: "Melalui program Tahfidz dan Tahsin dengan menggunakan Metode Ilman wa Ruuhan. Pembelajaran dirancang untuk membantu Murid membaca Al-Qur'an dengan baik dan benar, memperbaiki kualitas bacaan, menghafal Al-Qur'an secara bertahap, serta menumbuhkan kecintaan dan kedekatan dengan Al-Qur'an."
        },
        {
          title: "03. Pendekatan Pembelajaran ITT Integrated Tauhidic Thinking (Fase A)",
          desc: "Melalui Integrated Tauhidic Thinking (ITT) membangun pemahaman bahwa seluruh ciptaan, fenomena alam, dan perkembangan ilmu pengetahuan merupakan bagian dari tanda-tanda kekuasaan dan kebesaran Allah SWT."
        },
        {
          title: "04. BPI (Bina Pribadi Islam)",
          desc: "Membangun pribadi Murid yang beriman, berakhlak mulia, mandiri, bertanggung jawab, dan memiliki kepedulian terhadap sesama, dengan menjadikan nilai-nilai Islam sebagai landasan dalam kehidupan sehari-hari."
        },
        {
          title: "05. Bahasa Asing & Teknologi",
          desc: "Mengintegrasikan nilai-nilai Islam dengan penguasaan bahasa asing dan teknologi, sehingga Murid memiliki kemampuan komunikasi global, kecakapan digital, serta karakter yang kuat."
        },
        {
          title: "06. 7 Kokurikuler",
          desc: "Field Trip (belajar langsung relevan materi), Outing Class (eksplorasi lingkungan langsung), Guru Tamu (praktisi & profesional inspiratif), dan Program Kemandirian (disiplin, tanggung jawab & pengambilan keputusan)."
        }
      ],
      facilities: [
        "Ruang Kelas Ber-AC & Ramah Anak",
        "Perpustakaan sekolah",
        "Ruang Usaha Kesehatan Sekolah (UKS)",
        "Lapangan dan sarana aktivitas olahraga",
        "Ruang rapat dan koordinasi sekolah",
        "Fasilitas sanitasi dan toilet"
      ],
      spmbFee: "Rp 250.000",
      ageRequirement: "Usia minimal 6 tahun per 1 Juli tahun pelajaran berjalan",
      instagram: "https://www.instagram.com/sditbinainsanparepare/",
      instagramHandle: "@sditbinainsanparepare"
    },

    smpit: {
      id: "smpit",
      badge: "Menengah Pertama (Kelas 7 - 9)",
      name: "SMPIT Bina Insan Parepare",
      fullName: "Sekolah Menengah Pertama Islam Terpadu Bina Insan",
      heroImage: "/assets/images/smpit_students.jpg?v=2",
      accentColor: "#001f6b",
      tagline: "Membentuk Generasi Beriman, Berakhlak Mulia, dan Berpengetahuan Luas.",
      description: "SMP Islam Terpadu Bina Insan Parepare menyelenggarakan pendidikan berbasis Full Day School yang memadukan ilmu pengetahuan, nilai-nilai keislaman, dan pembentukan karakter. Melalui pembelajaran akademik, tahsin dan tahfiz Al-Qur’an, pembiasaan ibadah, penguatan Bahasa Arab dan Bahasa Inggris, serta pengembangan minat dan bakat, sekolah berkomitmen membentuk generasi yang cerdas, mandiri, berakhlak mulia, dan mampu memberikan manfaat bagi masyarakat.",
      vision: "Membentuk generasi yang cerdas, mandiri, berakhlak mulia, dan mampu memberikan manfaat bagi masyarakat.",
      keyPrograms: [
        {
          title: "Tahsin & Tahfiz Al-Qur’an",
          desc: "Pembinaan bacaan dan hafalan Al-Qur’an melalui tahsin, tahfiz, tilawah, dan munaqasyah untuk menumbuhkan kecintaan peserta didik terhadap Al-Qur’an."
        },
        {
          title: "Pembelajaran Akademik Berkualitas",
          desc: "Mengembangkan kemampuan berpikir kritis, kreativitas, literasi, dan numerasi melalui pembelajaran aktif, kontekstual, serta pemanfaatan teknologi pendidikan."
        },
        {
          title: "Penguatan Bahasa Arab & Inggris",
          desc: "Pembelajaran Bahasa Arab dan Bahasa Inggris untuk memperluas wawasan, meningkatkan kemampuan berkomunikasi, serta membekali peserta didik menghadapi perkembangan zaman."
        },
        {
          title: "Pramuka & Pembinaan Kepemimpinan",
          desc: "Melatih kemandirian, kedisiplinan, tanggung jawab, dan kerja sama melalui Pramuka, perkemahan, Super Camp, serta Latihan Dasar Kepemimpinan Siswa."
        }
      ],
      facilities: [
        "Ruang kelas VII, VIII, dan IX (7 ruang kelas)",
        "Perpustakaan sekolah",
        "Ruang Usaha Kesehatan Sekolah (UKS)",
        "Lapangan dan sarana aktivitas olahraga",
        "Ruang rapat dan koordinasi sekolah",
        "Fasilitas sanitasi dan toilet"
      ],
      extracurriculars: [
        {
          title: "Coding Club",
          desc: "Mengembangkan kemampuan berpikir logis, pemecahan masalah, dan keterampilan teknologi melalui kegiatan pemrograman yang sesuai dengan jenjang SMP."
        },
        {
          title: "Desain & Kreativitas Digital",
          desc: "Mengasah kreativitas dan keterampilan visual peserta didik melalui kegiatan desain dengan memanfaatkan teknologi digital."
        },
        {
          title: "Pramuka SIT",
          desc: "Membentuk pribadi yang mandiri, disiplin, bertanggung jawab, dan mampu bekerja sama melalui kegiatan kepramukaan dan pembinaan kepemimpinan."
        },
        {
          title: "Olahraga & Seni",
          desc: "Mengembangkan bakat, sportivitas, rasa percaya diri, dan kreativitas melalui futsal, bulu tangkis, basket, renang, serta tari."
        }
      ],
      spmbFee: "Rp 300.000",
      ageRequirement: "Lulusan SD/MI sederajat dengan ijazah / Surat Keterangan Lulus resmi"
    }
  },

  articles: [
    {
      id: 1,
      category: "Info SPMB",
      categoryClass: "badge-spmb",
      title: "Penerimaan Murid Baru (SPMB) SIT Bina Insan Parepare TP 2025/2026 Resmi Dibuka!",
      date: "10 Januari 2025",
      author: "Humas & Panitia SPMB",
      readTime: "3 menit baca",
      image: "/assets/images/hero_school.jpg?v=2",
      excerpt: "Pendaftaran peserta didik baru jenjang TKIT, SDIT, dan SMPIT Bina Insan Parepare telah dibuka. Dapatkan penawaran Infaq Pembangunan Gelombang 1 serta beasiswa tahfizh.",
      content: `
        <p>Alhamdulillah, seiring komitmen kami mencetak generasi Qur'ani berakhlak mulia di Kota Parepare dan sekitarnya, Panitia Sistem Penerimaan Murid Baru (SPMB) SIT Bina Insan Parepare secara resmi mengumumkan pembukaan pendaftaran siswa/peserta didik baru untuk Tahun Pelajaran 2025/2026.</p>
        
        <h3>Pilihan Jenjang & Kuota Pendaftaran</h3>
        <p>Tahun ini, SIT Bina Insan membuka kuota terbatas untuk menjamin rasio ideal antara pendidik dan peserta didik:</p>
        <ul>
          <li><strong>TKIT Bina Insan</strong>: Membuka kelas TK-A dan TK-B dengan pendekatan Sentra Ramah Anak.</li>
          <li><strong>SDIT Bina Insan</strong>: 4 Rombongan Belajar (Rombel) dengan fasilitas Kurikulum Merdeka Terpadu.</li>
          <li><strong>SMPIT Bina Insan</strong>: Pendidikan Berbasis Full Day School yang memadukan akademik, keislaman, dan karakter.</li>
        </ul>

        <h3>Keuntungan Mendaftar di Gelombang 1 (Early Bird)</h3>
        <p>Pendaftar yang menyelesaikan administrasi pada Gelombang 1 (November - Januari) berhak memperoleh diskon khusus Infaq Gedung sebesar 20%, prioritas seleksi tes observasi, serta seragam batik khas Bina Insan.</p>
        
        <p>Pendaftaran dapat dilakukan secara online melalui website resmi ini atau hadir langsung di Sekretariat SPMB SIT Bina Insan Parepare setiap hari kerja pukul 08.00 - 15.00 WITA.</p>
      `
    },
    {
      id: 2,
      category: "Prestasi",
      categoryClass: "badge-prestasi",
      title: "Siswa SMPIT Bina Insan Raih Juara 1 Robotik & Juara 2 Tahfizh Tingkat Provinsi Sulsel",
      date: "18 Desember 2024",
      author: "Tim Kesiswaan",
      readTime: "4 menit baca",
      image: "/assets/images/smpit_students.jpg?v=2",
      excerpt: "Prestasi membanggakan kembali dipersembahkan oleh ananda siswa SMPIT Bina Insan Parepare dalam ajang Olimpiade Sains dan Teknologi JSIT Sulsel 2024.",
      content: `
        <p>Prestasi gemilang ditorehkan oleh kontingen siswa SMPIT Bina Insan Parepare pada perhelatan akbar Festival & Olimpiade Pelajar Islam se-Sulawesi Selatan yang diselenggarakan di Makassar pekan lalu.</p>
        
        <p>Tim Robotik SMPIT Bina Insan yang digawangi oleh Muhammad Al-Fatih dan rekannya berhasil menyabet <strong>Juara 1 Kategori Line Follower Micro-Robot</strong> setelah mengungguli puluhan perwakilan sekolah favorit lainnya di Sulawesi Selatan.</p>

        <h3>Harmonisasi Sains dan Al-Qur'an</h3>
        <p>Tidak hanya cemerlang di bidang teknologi robotik, pada cabang Musabaqah Hifzhil Qur'an (MHQ) 5 Juz, ananda Aisyah Humaira (Kelas 8) sukses menyabet Juara 2 dengan nilai tajwid dan kelancaran hafalan yang memukau dewan juri.</p>
        
        <blockquote>"Keberhasilan ini membuktikan bahwa anak-anak yang tekun menghafal Al-Qur'an memiliki kecerdasan logika dan daya konsentrasi yang sangat tinggi untuk menguasai ilmu sains modern," tutur Kepala SMPIT Bina Insan.</blockquote>
      `
    },
    {
      id: 3,
      category: "Kegiatan Sekolah",
      categoryClass: "badge-kegiatan",
      title: "Keseruan Wisuda Tahfizh Akbar: 85 Siswa SDIT & SMPIT Diwisuda dengan Predikat Mutqin",
      date: "05 Desember 2024",
      author: "Koordinator Al-Qur'an",
      readTime: "3 menit baca",
      image: "/assets/images/sdit_recitation.jpg?v=2",
      excerpt: "Suasana haru dan penuh keberkahan mewarnai Gedung Islamic Centre Parepare saat 85 siswa SIT Bina Insan memasangkan mahkota kemuliaan kepada kedua orang tuanya.",
      content: `
        <p>Gedung pertemuan di Kota Parepare dipenuhi isak tangis haru bahagia para orang tua saat prosesi penyerahan mahkota simbolis dari siswa wisudawan tahfizh kepada ayah dan bunda tercinta pada acara <em>Wisuda Tahfizh Akbar SIT Bina Insan 2024</em>.</p>
        
        <p>Sebanyak 85 siswa jenjang SDIT dan SMPIT dinyatakan lulus uji tasmi' hafalan Al-Qur'an satu kali duduk di hadapan para penguji bersanad nasional, mulai dari kategori 3 Juz, 5 Juz, hingga siswa mutqin 10 Juz.</p>

        <p>Kegiatan ini merupakan agenda rutin tahunan Yayasan Bina Insan Parepare guna mengapresiasi ketekunan para siswa dan menjadi pemicu semangat bagi adik-adik kelas untuk senantiasa dekat dan mencintai Al-Qur'an.</p>
      `
    },
    {
      id: 4,
      category: "Opini Islami",
      categoryClass: "badge-opini",
      title: "Mendidik Karakter Anak di Era Digital: Peran Sinergi Sekolah dan Keluarga",
      date: "22 November 2024",
      author: "Dr. Ahmad Fauzi, S.Ag., M.Ed.",
      readTime: "5 menit baca",
      image: "/assets/images/principal.jpg?v=2",
      excerpt: "Tantangan mendidik anak saat ini bukan lagi sekadar memberi ilmu, melainkan membentengi hati anak dengan iman dan adab agar bijak menyikapi teknologi.",
      content: `
        <p>Perkembangan teknologi kecerdasan buatan, media sosial, dan gawai pintar menghadirkan pedang bermata dua bagi tumbuh kembang anak-anak kita. Jika tidak dilandasi pondasi adab yang kokoh, keterbukaan informasi ini dapat mengikis nilai-nilai luhur dan empati generasi muda.</p>
        
        <h3>Konsep Pendidikan Islam Terpadu</h3>
        <p>Di SIT Bina Insan Parepare, kami memandang bahwa ilmu umum dan ilmu agama bukanlah dua hal yang terpisah (dikotomis). Seluruh mata pelajaran sains, matematika, bahasa, dan sosial diintegrasikan dengan nilai-nilai tauhid dan kebesaran Allah SWT.</p>

        <p>Namun, pendidikan di sekolah hanyalah sepertiga dari total waktu anak. Dua pertiganya ada di rumah dan lingkungan. Oleh karena itu, program Bina Pribadi Islami (BPI) melibatkan peran aktif orang tua melalui buku penghubung mutaba'ah yaumiyah (ibadah harian) dan forum parenting berkala.</p>
      `
    },
    {
      id: 5,
      category: "Kegiatan Sekolah",
      categoryClass: "badge-kegiatan",
      title: "TKIT Bina Insan Gelar Market Day Ceria: Latih Jiwa Wirausaha dan Kejujuran Sejak Dini",
      date: "14 November 2024",
      author: "Humas TKIT",
      readTime: "3 menit baca",
      image: "/assets/images/tkit_activity.jpg?v=2",
      excerpt: "Penuh keceriaan, murid-murid cilik TKIT belajar bertransaksi jual beli makanan sehat dan prakarya buatan sendiri dengan uang kupon edukatif.",
      content: `
        <p>Halaman TKIT Bina Insan Parepare disulap menjadi pasar cilik tematik dalam kegiatan tahunan <em>Market Day Kids 2024</em>. Para ananda yang terbagi dalam stan-stan kecil menjajakan aneka kue sehat buatan bersama bunda serta hasil karya kreasi seni tangan.</p>
        
        <p>Melalui kegiatan ini, ananda usia dini belajar secara nyata konsep menghitung nilai mata uang, adab kejujuran berdagang ala Rasulullah SAW, rasa percaya diri menawarkan barang, serta sikap sabar mengantre saat berbelanja.</p>
      `
    }
  ],

  testimonials: [
    {
      name: "dr. H. Hendra Saputra, Sp.A",
      role: "Orang Tua Siswa SDIT & SMPIT Bina Insan",
      photo: "/assets/images/principal.jpg?v=2",
      quote: "Mempercayakan pendidikan anak-anak kami di SIT Bina Insan Parepare adalah keputusan terbaik keluarga kami. Pembiasaan shalat berjamaah dan hafalan Qur'annya luar biasa, anak-anak pulang ke rumah dengan adab yang sangat santun dan mandiri."
    },
    {
      name: "Hj. Nurhaedah, S.Pd., M.Si",
      role: "Orang Tua Siswa TKIT Bina Insan",
      photo: "/assets/images/tkit_activity.jpg?v=2",
      quote: "Anak saya di TKIT dulu pemalu sekali. Setelah 6 bulan di SIT Bina Insan dengan metode sentra bermainnya, sekarang sangat ceria, hafal puluhan doa harian, dan lancar membaca Iqro. Gurunya sabar dan penuh kasih sayang."
    },
    {
      name: "Ir. M. Ridwan Hakim, M.T",
      role: "Alumni Wali Murid & Dosen",
      photo: "/assets/images/smpit_students.jpg?v=2",
      quote: "Lulusan SMPIT Bina Insan memiliki bekal akademik sains yang kuat sekaligus kepribadian islami yang tangguh. Anak sulung saya kini lulus seleksi di SMA Unggulan Nasional tanpa kesulitan."
    }
  ],

  spmbFaqs: [
    {
      q: "Kapan periode pendaftaran SPMB SIT Bina Insan dibuka?",
      a: "Pendaftaran Gelombang 1 dibuka mulai 1 Januari s/d 31 Maret 2027. Gelombang 2 berlangsung 1 April s/d 31 Mei 2027, dan Gelombang 3 mulai 1 Juni 2027 s/d kuota terpenuhi. Pendaftaran dapat ditutup lebih awal apabila kuota rombel kelas telah terpenuhi."
    },
    {
      q: "Bagaimana tahapan seleksi masuk di TKIT, SDIT, dan SMPIT?",
      a: "Untuk TKIT, dilakukan observasi kesiapan tumbuh kembang anak dan wawancara orang tua. Untuk SDIT, observasi kematangan usia, motorik, pengenalan huruf/angka dasar, dan wawancara komitmen orang tua. Untuk SMPIT, tes potensi akademik, tes membaca & hafalan Al-Qur'an, tes psikotes dasar, serta wawancara calon siswa & orang tua."
    },
    {
      q: "Apakah ada jalur beasiswa bagi siswa berprestasi atau tahfizh?",
      a: "Ya! SIT Bina Insan menyediakan Jalur Prestasi Tahfizh (bebas biaya registrasi dan potongan SPP) bagi calon siswa yang memiliki hafalan minimal 2 Juz untuk SDIT dan minimal 3-5 Juz untuk SMPIT, serta Jalur Prestasi Olimpiade Sains dan Jalur Afirmasi Yatim/Dhuafa."
    },
    {
      q: "Bagaimana cara mencetak bukti pendaftaran online?",
      a: "Setelah mengisi formulir pendaftaran 4 langkah pada menu 'Daftar SPMB', sistem akan secara otomatis menerbitkan Kartu Tanda Peserta SPMB berisikan Nomor Registrasi resmi. Anda dapat langsung mengunduhnya dalam format PDF atau mencetaknya via tombol 'Cetak Bukti Pendaftaran'."
    },
    {
      q: "Apakah SMPIT Bina Insan Parepare memiliki program asrama (boarding)?",
      a: "Betul. SMPIT Bina Insan menyediakan dua pilihan program: Program Full Day School (pulang sore pukul 16.00 WITA) dan Program Pesantren / Boarding School dengan asrama putra dan putri terpisah yang didampingi musyrif/musyrifah 24 jam."
    }
  ],

  // Live School & SPMB Settings Repository (Sync with Admin Dashboard)
  settings: {
    academicYear: "2026/2027",
    activeWave: "wave3",
    waveStatus: "open",
    waveName: "Gelombang 3",
    waveDates: "1 Juni 2027 s/d Kuota Terpenuhi",
    waveNotice: "Pendaftaran Gelombang 3 (Kuota Terbatas) Sedang Berlangsung!",
    wave1Name: "Gelombang 1",
    wave1Promo: "Diskon Rp500.000",
    wave1Dates: "1 Januari 2027 s/d 31 Maret 2027",
    wave2Name: "Gelombang 2",
    wave2Promo: "Reguler",
    wave2Dates: "1 April 2027 s/d 31 Mei 2027",
    wave3Name: "Gelombang 3",
    wave3Promo: "S/d Kuota Terpenuhi",
    wave3Dates: "1 Juni 2027 s/d Kuota Terpenuhi",
    wavePoint1: "Prioritas Penempatan Kelas & Seleksi Observasi Dini",
    wavePoint2: "Tersedia Jalur Prestasi Tahfizh & Beasiswa Yatim",
    wavePoint3: "Layanan Konsultasi Pemilihan Peminatan & Ekskul",
    statTk: "180+",
    statSd: "650+",
    statSmp: "420+",
    statGuru: "85+",
    tkitFee: "Rp 200.000",
    sditFee: "Rp 250.000",
    smpitFee: "Rp 300.000",
    whatsappHelpdesk: "6285190610569",
    bankAccount: "Bank Syariah Indonesia (BSI) No. Rek: 711-234-5678 a.n Yayasan Bina Insan Parepare"
  }
};

// Dynamic synchronization with localStorage (CMS integration)
(function() {
  try {
    const savedArticles = localStorage.getItem('sit_bina_insan_articles_data');
    if (savedArticles) {
      const parsed = JSON.parse(savedArticles);
      if (Array.isArray(parsed) && parsed.length > 0) {
        SchoolData.articles = parsed;
      }
    } else {
      localStorage.setItem('sit_bina_insan_articles_data', JSON.stringify(SchoolData.articles));
    }

    const savedSettings = localStorage.getItem('sit_bina_insan_settings');
    if (savedSettings) {
      try {
        const parsedSet = JSON.parse(savedSettings);
        SchoolData.settings = Object.assign({}, SchoolData.settings, parsedSet);
        if (parsedSet.whatsappHelpdesk) {
          SchoolData.profile.whatsappHelpdesk = parsedSet.whatsappHelpdesk;
          SchoolData.profile.whatsapp = '+' + parsedSet.whatsappHelpdesk;
        }
      } catch (err) {}
    } else {
      try {
        localStorage.setItem('sit_bina_insan_settings', JSON.stringify(SchoolData.settings));
      } catch (err) {}
    }
  } catch (e) {
    console.warn('LocalStorage sync warning:', e);
  }
})();

// Export to global scope
window.SchoolData = SchoolData;

