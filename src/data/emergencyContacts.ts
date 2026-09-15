export interface DefaultEmergencyContact {
  id: string;
  name: string;
  number: string;
  category: 'Policía Nacional' | 'Bomberos' | 'SINAPROC' | 'Cruz Roja' | 'SUME 911' | 'Autoridad del Tránsito' | 'Mando PACSA';
  zone: 'Panamá Centro' | 'San Miguelito' | 'Panamá Norte' | 'Panamá Este' | 'Panamá Oeste' | 'Nacional / Central' | 'Colón' | 'Chiriquí' | 'Coclé' | 'Veraguas' | 'Herrera' | 'Los Santos' | 'Bocas del Toro' | 'Darién';
  address?: string;
  isOfficial?: boolean;
}

export const OFFICIAL_EMERGENCY_CONTACTS: DefaultEmergencyContact[] = [
  // ==========================================
  // NACIONAL / CENTRALES
  // ==========================================
  {
    id: 'nac-con-104',
    name: 'POLICÍA NACIONAL - DESPACHO NACIONAL (CON)',
    number: '104',
    category: 'Policía Nacional',
    zone: 'Nacional / Central',
    address: 'Centro de Operaciones Nacional 24/7',
    isOfficial: true
  },
  {
    id: 'nac-bcbrp-103',
    name: 'CUERPO DE BOMBEROS - DESPACHO CENTRAL',
    number: '103',
    category: 'Bomberos',
    zone: 'Nacional / Central',
    address: 'Línea Nacional de Emergencias BCBRP',
    isOfficial: true
  },
  {
    id: 'nac-sume-911',
    name: 'SUME 911 - DESPACHO NACIONAL DE AMBULANCIAS',
    number: '911',
    category: 'SUME 911',
    zone: 'Nacional / Central',
    address: 'Sistema Único de Manejo de Emergencias Médicas',
    isOfficial: true
  },
  {
    id: 'nac-sinaproc-335',
    name: 'SINAPROC - CENTRO DE OPERACIONES DE EMERGENCIA',
    number: '*335',
    category: 'SINAPROC',
    zone: 'Nacional / Central',
    address: 'Línea de Asistencia y Rescate SINAPROC',
    isOfficial: true
  },
  {
    id: 'nac-sinaproc-tel',
    name: 'SINAPROC - SEDE NACIONAL (DIRECCIÓN GENERAL)',
    number: '520-4429',
    category: 'SINAPROC',
    zone: 'Nacional / Central',
    address: 'Sede Howard / Emergencias 520-4426',
    isOfficial: true
  },
  {
    id: 'nac-cruz-roja',
    name: 'CRUZ ROJA PANAMEÑA - CENTRAL DE EMERGENCIAS',
    number: '315-1388',
    category: 'Cruz Roja',
    zone: 'Nacional / Central',
    address: 'Sede Central 4 de Noviembre / Albrook',
    isOfficial: true
  },
  {
    id: 'nac-dnot-transito',
    name: 'DNOT - POLICÍA DE TRÁNSITO CENTRAL',
    number: '511-5100',
    category: 'Autoridad del Tránsito',
    zone: 'Nacional / Central',
    address: 'Dirección Nacional de Operaciones de Tránsito',
    isOfficial: true
  },
  {
    id: 'nac-attt-311',
    name: 'ATTT - CENTRO DE ATENCIÓN CIUDADANA',
    number: '311',
    category: 'Autoridad del Tránsito',
    zone: 'Nacional / Central',
    address: 'Reportes y Emergencias Viales ATTT',
    isOfficial: true
  },
  {
    id: 'nac-mando-pacsa',
    name: 'MANDO CENTRAL PACSA - RADIO Y OPERACIONES',
    number: '6200-0000',
    category: 'Mando PACSA',
    zone: 'Nacional / Central',
    address: 'Base Operativa PACSA 24/7',
    isOfficial: true
  },

  // ==========================================
  // PANAMÁ CENTRO (POLICÍA NACIONAL)
  // ==========================================
  {
    id: 'pc-pn-ancon',
    name: 'POLICÍA NACIONAL - SEDE ANCON (ZONA METRO)',
    number: '511-7000',
    category: 'Policía Nacional',
    zone: 'Panamá Centro',
    address: 'Ancón, Cuartel Central',
    isOfficial: true
  },
  {
    id: 'pc-pn-calidonia',
    name: 'POLICÍA NACIONAL - SUBESTACIÓN CALIDONIA',
    number: '511-9300',
    category: 'Policía Nacional',
    zone: 'Panamá Centro',
    address: 'Calidonia, Calle 26 Este',
    isOfficial: true
  },
  {
    id: 'pc-pn-san-francisco',
    name: 'POLICÍA NACIONAL - SUBESTACIÓN SAN FRANCISCO',
    number: '511-9260',
    category: 'Policía Nacional',
    zone: 'Panamá Centro',
    address: 'San Francisco, Calle 50 y Vía Porras',
    isOfficial: true
  },
  {
    id: 'pc-pn-bella-vista',
    name: 'POLICÍA NACIONAL - SUBESTACIÓN BELLA VISTA',
    number: '511-9270',
    category: 'Policía Nacional',
    zone: 'Panamá Centro',
    address: 'Bella Vista, El Cangrejo / Vía Argentina',
    isOfficial: true
  },
  {
    id: 'pc-pn-bethania',
    name: 'POLICÍA NACIONAL - SUBESTACIÓN BETHANIA',
    number: '511-9240',
    category: 'Policía Nacional',
    zone: 'Panamá Centro',
    address: 'Bethania, Club X / Av. La Paz',
    isOfficial: true
  },
  {
    id: 'pc-pn-pueblo-nuevo',
    name: 'POLICÍA NACIONAL - SUBESTACIÓN PUEBLO NUEVO',
    number: '511-9250',
    category: 'Policía Nacional',
    zone: 'Panamá Centro',
    address: 'Pueblo Nuevo, Vía 12 de Octubre',
    isOfficial: true
  },
  {
    id: 'pc-pn-parque-lefevre',
    name: 'POLICÍA NACIONAL - SUBESTACIÓN PARQUE LEFEVRE',
    number: '511-9280',
    category: 'Policía Nacional',
    zone: 'Panamá Centro',
    address: 'Parque Lefevre y Río Abajo',
    isOfficial: true
  },
  {
    id: 'pc-pn-juan-diaz',
    name: 'POLICÍA NACIONAL - SUBESTACIÓN JUAN DÍAZ',
    number: '511-9120',
    category: 'Policía Nacional',
    zone: 'Panamá Centro',
    address: 'Juan Díaz, Los Pueblos / Vía España',
    isOfficial: true
  },
  {
    id: 'pc-pn-costa-del-este',
    name: 'POLICÍA NACIONAL - PUESTO COSTA DEL ESTE',
    number: '511-9121',
    category: 'Policía Nacional',
    zone: 'Panamá Centro',
    address: 'Costa del Este, Av. Centenario',
    isOfficial: true
  },
  {
    id: 'pc-pn-santa-ana',
    name: 'POLICÍA NACIONAL - SUBESTACIÓN SANTA ANA',
    number: '511-9310',
    category: 'Policía Nacional',
    zone: 'Panamá Centro',
    address: 'Santa Ana, Plaza Amador',
    isOfficial: true
  },
  {
    id: 'pc-pn-el-chorrillo',
    name: 'POLICÍA NACIONAL - SUBESTACIÓN EL CHORRILLO',
    number: '511-9320',
    category: 'Policía Nacional',
    zone: 'Panamá Centro',
    address: 'El Chorrillo, Calle 26 Oeste',
    isOfficial: true
  },
  {
    id: 'pc-pn-san-felipe',
    name: 'POLICÍA NACIONAL - SUBESTACIÓN SAN FELIPE (CASCO)',
    number: '511-9330',
    category: 'Policía Nacional',
    zone: 'Panamá Centro',
    address: 'Casco Antiguo, Calle 3ra San Felipe',
    isOfficial: true
  },
  {
    id: 'pc-pn-curundu',
    name: 'POLICÍA NACIONAL - SUBESTACIÓN CURUNDÚ',
    number: '511-9340',
    category: 'Policía Nacional',
    zone: 'Panamá Centro',
    address: 'Curundú, Sector Transporte',
    isOfficial: true
  },
  {
    id: 'pc-pn-balboa',
    name: 'POLICÍA NACIONAL - SUBESTACIÓN BALBOA / CANAL',
    number: '511-7080',
    category: 'Policía Nacional',
    zone: 'Panamá Centro',
    address: 'Balboa, Edif. Administrativo Canal',
    isOfficial: true
  },

  // ==========================================
  // PANAMÁ CENTRO (BOMBEROS BCBRP)
  // ==========================================
  {
    id: 'pc-bcbrp-calidonia',
    name: 'BOMBEROS - ESTACIÓN RICARDO ARANGO (CALIDONIA)',
    number: '512-6100',
    category: 'Bomberos',
    zone: 'Panamá Centro',
    address: 'Cuartel Central BCBRP, Calidonia',
    isOfficial: true
  },
  {
    id: 'pc-bcbrp-carrasquilla',
    name: 'BOMBEROS - ESTACIÓN DARÍO VALLARINO (CARRASQUILLA)',
    number: '512-6140',
    category: 'Bomberos',
    zone: 'Panamá Centro',
    address: 'Carrasquilla, Vía España',
    isOfficial: true
  },
  {
    id: 'pc-bcbrp-balboa',
    name: 'BOMBEROS - ESTACIÓN BALBOA (AMADOR / ANCON)',
    number: '512-6130',
    category: 'Bomberos',
    zone: 'Panamá Centro',
    address: 'Amador / Balboa, Calle Stevens',
    isOfficial: true
  },
  {
    id: 'pc-bcbrp-plaza-amador',
    name: 'BOMBEROS - ESTACIÓN PLAZA AMADOR (CHORRILLO)',
    number: '512-6120',
    category: 'Bomberos',
    zone: 'Panamá Centro',
    address: 'Plaza Amador, Av. A',
    isOfficial: true
  },
  {
    id: 'pc-bcbrp-juan-diaz',
    name: 'BOMBEROS - ESTACIÓN JUAN DÍAZ',
    number: '512-6150',
    category: 'Bomberos',
    zone: 'Panamá Centro',
    address: 'Juan Díaz, Carretera Principal',
    isOfficial: true
  },
  {
    id: 'pc-bcbrp-san-felipe',
    name: 'BOMBEROS - ESTACIÓN SAN FELIPE',
    number: '512-6125',
    category: 'Bomberos',
    zone: 'Panamá Centro',
    address: 'Casco Antiguo, Calle 5ta Este',
    isOfficial: true
  },

  // ==========================================
  // SAN MIGUELITO (POLICÍA NACIONAL)
  // ==========================================
  {
    id: 'sm-pn-santa-marta',
    name: 'POLICÍA NACIONAL - SEDE SAN MIGUELITO (STA MARTA)',
    number: '511-9200',
    category: 'Policía Nacional',
    zone: 'San Miguelito',
    address: 'Santa Marta, Sede Zona Policial 11va',
    isOfficial: true
  },
  {
    id: 'sm-pn-paraiso',
    name: 'POLICÍA NACIONAL - SUBESTACIÓN PARAÍSO',
    number: '511-9210',
    category: 'Policía Nacional',
    zone: 'San Miguelito',
    address: 'Paraíso, Calle H principal',
    isOfficial: true
  },
  {
    id: 'sm-pn-los-andes',
    name: 'POLICÍA NACIONAL - SUBESTACIÓN LOS ANDES',
    number: '511-9220',
    category: 'Policía Nacional',
    zone: 'San Miguelito',
    address: 'Los Andes #2 y San Isidro',
    isOfficial: true
  },
  {
    id: 'sm-pn-torrijos-carter',
    name: 'POLICÍA NACIONAL - SUBESTACIÓN TORRIJOS CARTER',
    number: '511-9230',
    category: 'Policía Nacional',
    zone: 'San Miguelito',
    address: 'Torrijos Carter, Sector 1',
    isOfficial: true
  },
  {
    id: 'sm-pn-brisas-del-golf',
    name: 'POLICÍA NACIONAL - SUBESTACIÓN BRISAS DEL GOLF',
    number: '511-9235',
    category: 'Policía Nacional',
    zone: 'San Miguelito',
    address: 'Brisas del Golf, Calle Principal',
    isOfficial: true
  },
  {
    id: 'sm-pn-samaria',
    name: 'POLICÍA NACIONAL - SUBESTACIÓN SAMARIA',
    number: '511-9215',
    category: 'Policía Nacional',
    zone: 'San Miguelito',
    address: 'Samaria, Sector 4',
    isOfficial: true
  },
  {
    id: 'sm-pn-villa-lucre',
    name: 'POLICÍA NACIONAL - SUBESTACIÓN VILLA LUCRE',
    number: '511-9225',
    category: 'Policía Nacional',
    zone: 'San Miguelito',
    address: 'Villa Lucre y Cerro Viento',
    isOfficial: true
  },
  {
    id: 'sm-pn-roberto-duran',
    name: 'POLICÍA NACIONAL - PUESTO ROBERTO DURÁN',
    number: '511-9232',
    category: 'Policía Nacional',
    zone: 'San Miguelito',
    address: 'Mano de Piedra / Roberto Durán',
    isOfficial: true
  },

  // ==========================================
  // SAN MIGUELITO (BOMBEROS BCBRP)
  // ==========================================
  {
    id: 'sm-bcbrp-victoriano',
    name: 'BOMBEROS - ESTACIÓN VICTORIANO LORENZO (LOS ANDES)',
    number: '512-6160',
    category: 'Bomberos',
    zone: 'San Miguelito',
    address: 'Los Andes #1, Av. Transístmica',
    isOfficial: true
  },
  {
    id: 'sm-bcbrp-brisas',
    name: 'BOMBEROS - ESTACIÓN BRISAS DEL GOLF',
    number: '512-6165',
    category: 'Bomberos',
    zone: 'San Miguelito',
    address: 'Brisas del Golf, Frente a la entrada',
    isOfficial: true
  },
  {
    id: 'sm-cruz-roja',
    name: 'CRUZ ROJA - BASE SAN MIGUELITO',
    number: '267-3344',
    category: 'Cruz Roja',
    zone: 'San Miguelito',
    address: 'Paraíso, San Miguelito',
    isOfficial: true
  },

  // ==========================================
  // PANAMÁ NORTE (POLICÍA NACIONAL)
  // ==========================================
  {
    id: 'pn-pn-alcalde-diaz',
    name: 'POLICÍA NACIONAL - SEDE PANAMÁ NORTE (ALCALDE DÍAZ)',
    number: '511-9080',
    category: 'Policía Nacional',
    zone: 'Panamá Norte',
    address: 'Alcalde Díaz, Sede Zona Policial',
    isOfficial: true
  },
  {
    id: 'pn-pn-las-cumbres',
    name: 'POLICÍA NACIONAL - SUBESTACIÓN LAS CUMBRES',
    number: '511-9090',
    category: 'Policía Nacional',
    zone: 'Panamá Norte',
    address: 'Las Cumbres, Entrada de Gonzalillo',
    isOfficial: true
  },
  {
    id: 'pn-pn-chilibre',
    name: 'POLICÍA NACIONAL - SUBESTACIÓN CHILIBRE',
    number: '511-9085',
    category: 'Policía Nacional',
    zone: 'Panamá Norte',
    address: 'Chilibre Centro, Vía Transístmica',
    isOfficial: true
  },
  {
    id: 'pn-pn-caimitillo',
    name: 'POLICÍA NACIONAL - SUBESTACIÓN CAIMITILLO',
    number: '511-9095',
    category: 'Policía Nacional',
    zone: 'Panamá Norte',
    address: 'Caimitillo y Calzada Larga',
    isOfficial: true
  },
  {
    id: 'pn-pn-ernesto-cordoba',
    name: 'POLICÍA NACIONAL - SUBESTACIÓN ERNESTO CÓRDOBA',
    number: '511-9088',
    category: 'Policía Nacional',
    zone: 'Panamá Norte',
    address: 'Ernesto Córdoba Campos / San Juan de Dios',
    isOfficial: true
  },
  {
    id: 'pn-pn-villa-zaita',
    name: 'POLICÍA NACIONAL - PUESTO POLICIAL VILLA ZAITA',
    number: '511-9092',
    category: 'Policía Nacional',
    zone: 'Panamá Norte',
    address: 'Villa Zaita, Plaza Comercial',
    isOfficial: true
  },

  // ==========================================
  // PANAMÁ NORTE (BOMBEROS BCBRP)
  // ==========================================
  {
    id: 'pn-bcbrp-alcalde-diaz',
    name: 'BOMBEROS - ESTACIÓN ALCALDE DÍAZ / CUMBRES',
    number: '512-6170',
    category: 'Bomberos',
    zone: 'Panamá Norte',
    address: 'Alcalde Díaz, Vía Principal',
    isOfficial: true
  },
  {
    id: 'pn-bcbrp-chilibre',
    name: 'BOMBEROS - ESTACIÓN CHILIBRE',
    number: '512-6175',
    category: 'Bomberos',
    zone: 'Panamá Norte',
    address: 'Chilibre, Transístmica km 24',
    isOfficial: true
  },

  // ==========================================
  // PANAMÁ ESTE (POLICÍA NACIONAL)
  // ==========================================
  {
    id: 'pe-pn-pacora',
    name: 'POLICÍA NACIONAL - SEDE PANAMÁ ESTE (PACORA)',
    number: '511-9100',
    category: 'Policía Nacional',
    zone: 'Panamá Este',
    address: 'Pacora, Sede Zona Policial Este',
    isOfficial: true
  },
  {
    id: 'pe-pn-tocumen',
    name: 'POLICÍA NACIONAL - SUBESTACIÓN TOCUMEN',
    number: '511-9110',
    category: 'Policía Nacional',
    zone: 'Panamá Este',
    address: 'Tocumen Centro, Vía Panamericana',
    isOfficial: true
  },
  {
    id: 'pe-pn-24-diciembre',
    name: 'POLICÍA NACIONAL - SUBESTACIÓN 24 DE DICIEMBRE',
    number: '511-9115',
    category: 'Policía Nacional',
    zone: 'Panamá Este',
    address: '24 de Diciembre, Cruce La Doña',
    isOfficial: true
  },
  {
    id: 'pe-pn-mananitas',
    name: 'POLICÍA NACIONAL - SUBESTACIÓN LAS MAÑANITAS',
    number: '511-9125',
    category: 'Policía Nacional',
    zone: 'Panamá Este',
    address: 'Las Mañanitas, Sector 1',
    isOfficial: true
  },
  {
    id: 'pe-pn-pedregal',
    name: 'POLICÍA NACIONAL - SUBESTACIÓN PEDREGAL',
    number: '511-9130',
    category: 'Policía Nacional',
    zone: 'Panamá Este',
    address: 'Pedregal, Balper',
    isOfficial: true
  },
  {
    id: 'pe-pn-felipillo',
    name: 'POLICÍA NACIONAL - SUBESTACIÓN FELIPILLO',
    number: '511-9118',
    category: 'Policía Nacional',
    zone: 'Panamá Este',
    address: 'Felipillo, Frente a la entrada',
    isOfficial: true
  },
  {
    id: 'pe-pn-chepo',
    name: 'POLICÍA NACIONAL - SUBESTACIÓN CHEPO',
    number: '296-7100',
    category: 'Policía Nacional',
    zone: 'Panamá Este',
    address: 'Chepo Cabecera',
    isOfficial: true
  },
  {
    id: 'pe-pn-tanara',
    name: 'POLICÍA NACIONAL - SUBESTACIÓN TANARA',
    number: '511-9145',
    category: 'Policía Nacional',
    zone: 'Panamá Este',
    address: 'Tanara de Chepo',
    isOfficial: true
  },
  {
    id: 'pe-pn-garzas',
    name: 'POLICÍA NACIONAL - SUBESTACIÓN LAS GARZAS',
    number: '511-9112',
    category: 'Policía Nacional',
    zone: 'Panamá Este',
    address: 'Las Garzas de Pacora',
    isOfficial: true
  },
  {
    id: 'pe-pn-canita',
    name: 'POLICÍA NACIONAL - PUESTO CAÑITA DE CHEPO',
    number: '296-7110',
    category: 'Policía Nacional',
    zone: 'Panamá Este',
    address: 'Cañita de Chepo, Vía Darién',
    isOfficial: true
  },

  // ==========================================
  // PANAMÁ ESTE (BOMBEROS BCBRP)
  // ==========================================
  {
    id: 'pe-bcbrp-tocumen',
    name: 'BOMBEROS - ESTACIÓN TOCUMEN (AEROPUERTO / ZONA)',
    number: '512-6180',
    category: 'Bomberos',
    zone: 'Panamá Este',
    address: 'Tocumen, Entrada del Aeropuerto',
    isOfficial: true
  },
  {
    id: 'pe-bcbrp-24-diciembre',
    name: 'BOMBEROS - ESTACIÓN 24 DE DICIEMBRE',
    number: '512-6185',
    category: 'Bomberos',
    zone: 'Panamá Este',
    address: '24 de Diciembre, Vía Panamericana',
    isOfficial: true
  },
  {
    id: 'pe-bcbrp-chepo',
    name: 'BOMBEROS - ESTACIÓN CHEPO',
    number: '296-7200',
    category: 'Bomberos',
    zone: 'Panamá Este',
    address: 'Chepo Cabecera, Calle Principal',
    isOfficial: true
  },
  {
    id: 'pe-bcbrp-felipillo',
    name: 'BOMBEROS - SUBESTACIÓN FELIPILLO / PACORA',
    number: '512-6188',
    category: 'Bomberos',
    zone: 'Panamá Este',
    address: 'Felipillo, Pacora',
    isOfficial: true
  },
  {
    id: 'pe-sinaproc-chepo',
    name: 'SINAPROC - BASE OPERATIVA CHEPO',
    number: '296-7300',
    category: 'SINAPROC',
    zone: 'Panamá Este',
    address: 'Chepo, Zona Este',
    isOfficial: true
  },

  // ==========================================
  // PANAMÁ OESTE (POLICÍA NACIONAL)
  // ==========================================
  {
    id: 'po-pn-la-chorrera',
    name: 'POLICÍA NACIONAL - SEDE ZONA OESTE (LA CHORRERA)',
    number: '511-9500',
    category: 'Policía Nacional',
    zone: 'Panamá Oeste',
    address: 'La Chorrera, Av. de las Américas',
    isOfficial: true
  },
  {
    id: 'po-pn-arraijan',
    name: 'POLICÍA NACIONAL - SUBESTACIÓN ARRAIJÁN CABECERA',
    number: '511-9400',
    category: 'Policía Nacional',
    zone: 'Panamá Oeste',
    address: 'Arraiján Cabecera, Calle Central',
    isOfficial: true
  },
  {
    id: 'po-pn-vista-alegre',
    name: 'POLICÍA NACIONAL - SUBESTACIÓN VISTA ALEGRE',
    number: '511-9410',
    category: 'Policía Nacional',
    zone: 'Panamá Oeste',
    address: 'Vista Alegre, Vía Interamericana',
    isOfficial: true
  },
  {
    id: 'po-pn-burunga',
    name: 'POLICÍA NACIONAL - SUBESTACIÓN BURUNGA',
    number: '511-9420',
    category: 'Policía Nacional',
    zone: 'Panamá Oeste',
    address: 'Burunga, Sector 2',
    isOfficial: true
  },
  {
    id: 'po-pn-nuevo-arraijan',
    name: 'POLICÍA NACIONAL - SUBESTACIÓN NUEVO ARRAIJÁN',
    number: '511-9415',
    category: 'Policía Nacional',
    zone: 'Panamá Oeste',
    address: 'Juan Demóstenes Arosemena / Nuevo Arraiján',
    isOfficial: true
  },
  {
    id: 'po-pn-vacamonte',
    name: 'POLICÍA NACIONAL - SUBESTACIÓN VACAMONTE',
    number: '511-9430',
    category: 'Policía Nacional',
    zone: 'Panamá Oeste',
    address: 'Puerto Vacamonte y Residenciales',
    isOfficial: true
  },
  {
    id: 'po-pn-veracruz',
    name: 'POLICÍA NACIONAL - SUBESTACIÓN VERACRUZ',
    number: '511-9440',
    category: 'Policía Nacional',
    zone: 'Panamá Oeste',
    address: 'Veracruz Centro, Calle Principal',
    isOfficial: true
  },
  {
    id: 'po-pn-guadalupe',
    name: 'POLICÍA NACIONAL - SUBESTACIÓN GUADALUPE',
    number: '511-9510',
    category: 'Policía Nacional',
    zone: 'Panamá Oeste',
    address: 'Guadalupe, La Chorrera',
    isOfficial: true
  },
  {
    id: 'po-pn-barrio-balboa',
    name: 'POLICÍA NACIONAL - SUBESTACIÓN BARRIO BALBOA',
    number: '511-9520',
    category: 'Policía Nacional',
    zone: 'Panamá Oeste',
    address: 'Barrio Balboa, La Chorrera',
    isOfficial: true
  },
  {
    id: 'po-pn-barrio-colon',
    name: 'POLICÍA NACIONAL - SUBESTACIÓN BARRIO COLÓN',
    number: '511-9530',
    category: 'Policía Nacional',
    zone: 'Panamá Oeste',
    address: 'Barrio Colón, La Chorrera',
    isOfficial: true
  },
  {
    id: 'po-pn-capira',
    name: 'POLICÍA NACIONAL - SUBESTACIÓN CAPIRA',
    number: '244-9100',
    category: 'Policía Nacional',
    zone: 'Panamá Oeste',
    address: 'Capira Cabecera, Interamericana',
    isOfficial: true
  },
  {
    id: 'po-pn-chame',
    name: 'POLICÍA NACIONAL - SUBESTACIÓN CHAME',
    number: '240-6020',
    category: 'Policía Nacional',
    zone: 'Panamá Oeste',
    address: 'Chame Cabecera',
    isOfficial: true
  },
  {
    id: 'po-pn-coronado',
    name: 'POLICÍA NACIONAL - SUBESTACIÓN CORONADO',
    number: '240-4100',
    category: 'Policía Nacional',
    zone: 'Panamá Oeste',
    address: 'Entrada de Coronado, Chame',
    isOfficial: true
  },
  {
    id: 'po-pn-san-carlos',
    name: 'POLICÍA NACIONAL - SUBESTACIÓN SAN CARLOS',
    number: '240-8020',
    category: 'Policía Nacional',
    zone: 'Panamá Oeste',
    address: 'San Carlos Cabecera',
    isOfficial: true
  },

  // ==========================================
  // PANAMÁ OESTE (BOMBEROS BCBRP)
  // ==========================================
  {
    id: 'po-bcbrp-la-chorrera',
    name: 'BOMBEROS - ESTACIÓN LA CHORRERA (CUARTEL CENTRAL)',
    number: '512-6420',
    category: 'Bomberos',
    zone: 'Panamá Oeste',
    address: 'La Chorrera, Calle Rosario',
    isOfficial: true
  },
  {
    id: 'po-bcbrp-arraijan',
    name: 'BOMBEROS - ESTACIÓN ARRAIJÁN CABECERA',
    number: '512-6400',
    category: 'Bomberos',
    zone: 'Panamá Oeste',
    address: 'Arraiján Cabecera, Carretera Interamericana',
    isOfficial: true
  },
  {
    id: 'po-bcbrp-vista-alegre',
    name: 'BOMBEROS - ESTACIÓN VISTA ALEGRE',
    number: '512-6410',
    category: 'Bomberos',
    zone: 'Panamá Oeste',
    address: 'Vista Alegre, Arraiján',
    isOfficial: true
  },
  {
    id: 'po-bcbrp-vacamonte',
    name: 'BOMBEROS - SUBESTACIÓN VACAMONTE',
    number: '512-6415',
    category: 'Bomberos',
    zone: 'Panamá Oeste',
    address: 'Vía Puerto Vacamonte',
    isOfficial: true
  },
  {
    id: 'po-bcbrp-capira',
    name: 'BOMBEROS - ESTACIÓN CAPIRA',
    number: '244-9333',
    category: 'Bomberos',
    zone: 'Panamá Oeste',
    address: 'Capira Centro, Interamericana',
    isOfficial: true
  },
  {
    id: 'po-bcbrp-chame',
    name: 'BOMBEROS - ESTACIÓN CHAME',
    number: '240-6333',
    category: 'Bomberos',
    zone: 'Panamá Oeste',
    address: 'Chame, Frente a la Carretera Interamericana',
    isOfficial: true
  },
  {
    id: 'po-bcbrp-san-carlos',
    name: 'BOMBEROS - ESTACIÓN SAN CARLOS',
    number: '240-8333',
    category: 'Bomberos',
    zone: 'Panamá Oeste',
    address: 'San Carlos Centro',
    isOfficial: true
  },
  {
    id: 'po-sinaproc-chorrera',
    name: 'SINAPROC - BASE OPERATIVA PANAMÁ OESTE',
    number: '253-3330',
    category: 'SINAPROC',
    zone: 'Panamá Oeste',
    address: 'La Chorrera, Av. Central',
    isOfficial: true
  },
  {
    id: 'po-cruz-roja-arraijan',
    name: 'CRUZ ROJA - BASE ARRAIJÁN',
    number: '259-9911',
    category: 'Cruz Roja',
    zone: 'Panamá Oeste',
    address: 'Arraiján Cabecera',
    isOfficial: true
  },

  // ==========================================
  // OTRAS PROVINCIAS (CENTRALES CLAVE)
  // ==========================================
  {
    id: 'col-pn-colon',
    name: 'POLICÍA NACIONAL - SEDE ZONA COLÓN',
    number: '511-9600',
    category: 'Policía Nacional',
    zone: 'Colón',
    address: 'Calle 11 y Bolívar, Colón',
    isOfficial: true
  },
  {
    id: 'col-bcbrp-colon',
    name: 'BOMBEROS - ESTACIÓN CENTRAL COLÓN',
    number: '512-6500',
    category: 'Bomberos',
    zone: 'Colón',
    address: 'Calle 11 y Amador Guerrero, Colón',
    isOfficial: true
  },
  {
    id: 'chi-pn-david',
    name: 'POLICÍA NACIONAL - SEDE ZONA CHIRIQUÍ (DAVID)',
    number: '511-9800',
    category: 'Policía Nacional',
    zone: 'Chiriquí',
    address: 'David, Chiriquí Centro',
    isOfficial: true
  },
  {
    id: 'chi-bcbrp-david',
    name: 'BOMBEROS - ESTACIÓN CENTRAL DAVID',
    number: '512-6700',
    category: 'Bomberos',
    zone: 'Chiriquí',
    address: 'David, Chiriquí',
    isOfficial: true
  }
];
