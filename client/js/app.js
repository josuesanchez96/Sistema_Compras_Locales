document.addEventListener('alpine:init', () => {
  Alpine.data('comprasApp', () => ({
    // Auth & Navigation
    token: localStorage.getItem('token') || '',
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    loginForm: {
      usuario: '',
      password: ''
    },
    authError: '',
    isLoading: false,

    sidebarOpen: true,
    currentView: 'dashboard',
    hasUnsavedChanges: false,
    
    // Toast Notification
    toast: { show: false, message: '', type: 'info' },

    // Dashboard state
    dashboardData: {
      kpis: { total_pedidos: 0, ingresados: 0, pendientes: 0, monto_invertido: 0 },
      consolidado: [],
      resumen_renglones: []
    },
    dashFilterCuatrimestre: 'todos',
    dashFilterEstado: 'todos',
    dashFilterRenglon: '',
    dashSearch: '',
    dashSortColumn: 'numero_pedido',
    dashSortAsc: false,
    dashPage: 1,
    dashPerPage: 50,
    expandedDashPedido: null,
    dashSubView: 'consolidado', // Submódulos: 'consolidado' (Principal) o 'resumen' (Secundario)

    // Data lists
    usuariosList: [],
    rolesList: [],
    newUsuario: { id_usuario: '', nombre_completo: '', usuario: '', password: '', roles: [] },
    editUsuario: { id_usuario: '', nombre_completo: '', usuario: '', roles: [] },
    passwordData: { id_usuario: '', nombre_completo: '', password: '' },

    productosList: [],
    productoSearch: '',
    productoPage: 1,
    productoPerPage: 50,
    newProducto: { codigo: '', descripcion: '', renglon: '' },
    editProducto: { codigo: '', descripcion: '', renglon: '' },

    responsablesList: [],
    newResponsable: { id_responsable: '', nombre_completo: '' },
    editResponsable: { id_responsable: '', nombre_completo: '' },

    tiposCompraList: [],
    newTipoCompra: { id_tipo_compra: '', nombre_tipo: '' },
    editTipoCompra: { id_tipo_compra: '', nombre_tipo: '' },

    proveedoresList: [],
    proveedorSearch: '',
    proveedorPage: 1,
    proveedorPerPage: 50,
    newProveedor: { nit: '', nombre_proveedor: '' },
    editProveedor: { nit: '', nombre_proveedor: '' },

    pedidosList: [],
    pedidoSearch: '',
    pedidoSortKey: 'numero_pedido',
    pedidoSortDir: 'asc',
    pedidoPage: 1,
    pedidoPerPage: 50,
    expandedPedidoId: null,
    newPedido: { numero_pedido: '', fecha_pedido: new Date().toISOString().split('T')[0], codigo: '', cantidad: 1, justificacion: '' },
    editPedido: { numero_pedido: '', fecha_pedido: '', codigo: '', cantidad: 1, justificacion: '', id_responsable: '' },

    asignacionesList: [],

    ordenesList: [],
    ordenSearch: '',
    ordenSortKey: 'numero_orden_compra',
    ordenSortDir: 'asc',
    ordenPage: 1,
    ordenPerPage: 50,
    pedidoSearchModal: '',
    pedidoDropdownOpen: false,
    newOrden: { numero_orden_compra: '', numero_pedido: '', id_tipo_compra: 'BC', fecha_orden: new Date().toISOString().split('T')[0], fecha_notificacion: '', fecha_vencimiento: '' },
    editOrden: { numero_orden_compra: '', numero_pedido: '', id_tipo_compra: 'BC', fecha_orden: '', fecha_notificacion: '', fecha_vencimiento: '' },
    entregaOrdenesList: [],
    entregaOrdenSearch: '',
    entregaOrdenSortKey: 'numero_pedido',
    entregaOrdenSortDir: 'asc',
    soloPendientesEntrega: false,
    soloPendientesRecepcion: false,
    entregaOrdenPage: 1,
    entregaOrdenPerPage: 50,
    entregaExpedientesList: [],
    entregaExpedienteSearch: '',
    entregaExpedienteSortKey: 'numero_pedido',
    entregaExpedienteSortDir: 'asc',
    soloPendientesExpediente: false,
    entregaExpedientePage: 1,
    entregaExpedientePerPage: 50,
    recepcionesCompraList: [],
    newRecepcionCompra: {
      numero_orden_compra: '',
      fecha_ingreso: new Date().toISOString().split('T')[0],
      serie_factura: '',
      numero_factura: '',
      nit: '',
      precio_unitario: ''
    },

    // Modals visibility
    showUsuarioModal: false,
    showEditUsuarioModal: false,
    showPasswordModal: false,
    showProductoModal: false,
    showEditProductoModal: false,
    showResponsableModal: false,
    showEditResponsableModal: false,
    showTipoCompraModal: false,
    showEditTipoCompraModal: false,
    showProveedorModal: false,
    showEditProveedorModal: false,
    showPedidoModal: false,
    showEditPedidoModal: false,
    showOrdenModal: false,
    showEditOrdenModal: false,
    showRecepcionCompraModal: false,
    showEditRecepcionCompraModal: false,
    editRecepcionCompraData: {
      id_recepcion_compra: null,
      numero_orden_compra: '',
      numero_pedido: '',
      descripcion_producto: '',
      codigo: '',
      cantidad: 0,
      fecha_ingreso: '',
      serie_factura: '',
      numero_factura: '',
      nit: '',
      nombre_proveedor: '',
      precio_unitario: ''
    },

    init() {
      if (this.token && this.user) {
        this.loadDashboard();
        this.loadAllBaseData();
      }
    },

    showToast(message, type = 'info') {
      this.toast = { show: true, message, type };
      setTimeout(() => { this.toast.show = false; }, 4000);
    },

    // --- AUTENTICACIÓN ---
    async login() {
      this.authError = '';
      this.isLoading = true;
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.loginForm)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al iniciar sesión');

        this.token = data.token;
        this.user = data.user;
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        this.showToast(`Bienvenido ${this.user.nombre_completo}`, 'success');
        this.currentView = 'dashboard';
        this.loadDashboard();
        this.loadAllBaseData();
      } catch (err) {
        this.authError = err.message;
      } finally {
        this.isLoading = false;
      }
    },

    logout() {
      if (this.hasUnsavedChanges) {
        if (!confirm('Tiene cambios sin guardar. ¿Está seguro de que desea salir?')) return;
      }
      this.token = '';
      this.user = null;
      this.hasUnsavedChanges = false;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      this.showToast('Sesión cerrada correctamente.', 'info');
    },

    hasRole(roleName) {
      if (!this.user || !this.user.roles) return false;
      return this.user.roles.includes(roleName);
    },

    switchView(viewName) {
      if (this.hasUnsavedChanges) {
        if (!confirm('Atención: Tiene asignaciones sin guardar. Si cambia de vista se perderán los cambios. ¿Desea continuar?')) {
          return;
        }
        this.hasUnsavedChanges = false;
      }

      this.currentView = viewName;

      // Auto-collapse sidebar for wide tables
      if (['dashboard', 'pedidos', 'ordenes', 'recepcion_compra'].includes(viewName)) {
        // Option to give maximum space
      }

      // Cargar datos según la vista
      if (viewName === 'dashboard') this.loadDashboard();
      else if (viewName === 'usuarios') this.loadUsuarios();
      else if (viewName === 'productos') this.loadProductos();
      else if (viewName === 'responsables') this.loadResponsables();
      else if (viewName === 'tipocompra') this.loadTiposCompra();
      else if (viewName === 'proveedores') this.loadProveedores();
      else if (viewName === 'pedidos') this.loadPedidos();
      else if (viewName === 'asignacion') this.loadAsignaciones();
      else if (viewName === 'ordenes') this.loadOrdenes();
      else if (viewName === 'entrega_orden') this.loadEntregaOrdenes();
      else if (viewName === 'entrega_expediente') this.loadEntregaExpedientes();
      else if (viewName === 'recepcion_compra') this.loadRecepcionesCompra();
    },

    async fetchAuth(url, options = {}) {
      const headers = {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        ...(options.headers || {})
      };
      const res = await fetch(url, { ...options, headers });
      
      const contentType = res.headers.get('content-type') || '';
      let data;

      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        if (!res.ok || text.startsWith('<!DOCTYPE')) {
          if (res.status === 404) {
            throw new Error('La ruta solicitada no se encontró en el servidor. Por favor asegúrese de reiniciar el servidor Node.js.');
          }
          throw new Error(`Respuesta del servidor (${res.status}): Se recibió contenido HTML en lugar de JSON.`);
        }
        throw new Error('La respuesta del servidor no es un formato JSON válido.');
      }

      if (res.status === 401 || res.status === 403) {
        if (res.status === 401) {
          this.logout();
        }
        throw new Error(data.error || 'No tiene permisos para realizar esta acción.');
      }
      if (!res.ok) throw new Error(data.error || 'Error en la solicitud.');
      return data;
    },

    async loadAllBaseData() {
      try {
        this.loadResponsables();
        this.loadTiposCompra();
        this.loadProveedores();
        this.loadProductos();
      } catch (e) {
        console.warn('Error cargando catálogos iniciales:', e);
      }
    },

    // --- DASHBOARD METRICS & FILTERS ---
    async loadDashboard() {
      try {
        const data = await this.fetchAuth('/api/dashboard');
        this.dashboardData = data;
      } catch (err) {
        this.showToast(err.message, 'error');
      }
    },

    get filteredConsolidado() {
      let list = this.dashboardData.consolidado || [];

      // Filtro Cuatrimestre
      if (this.dashFilterCuatrimestre !== 'todos') {
        const q = parseInt(this.dashFilterCuatrimestre, 10);
        list = list.filter(r => r.cuatrimestre === q);
      }

      // Filtro Estado
      if (this.dashFilterEstado !== 'todos') {
        const filterVal = String(this.dashFilterEstado).toLowerCase().trim();
        list = list.filter(r => {
          if (!r.estado) return false;
          const estadoRow = String(r.estado).toLowerCase().trim();
          return estadoRow === filterVal || (estadoRow + 's') === filterVal || estadoRow === (filterVal + 's');
        });
      }

      // Filtro Renglón (por click en Sub-Ventana 2)
      if (this.dashFilterRenglon) {
        list = list.filter(r => String(r.renglon) === String(this.dashFilterRenglon));
      }

      // Buscador reactivo
      if (this.dashSearch.trim()) {
        const term = this.dashSearch.toLowerCase().trim();
        list = list.filter(r => 
          String(r.numero_pedido).toLowerCase().includes(term) ||
          (r.numero_orden_compra && String(r.numero_orden_compra).toLowerCase().includes(term)) ||
          String(r.codigo).toLowerCase().includes(term) ||
          (r.descripcion_producto && r.descripcion_producto.toLowerCase().includes(term)) ||
          (r.renglon && String(r.renglon).toLowerCase().includes(term))
        );
      }

      // Ordenamiento
      list.sort((a, b) => {
        let valA = a[this.dashSortColumn];
        let valB = b[this.dashSortColumn];
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();
        if (valA < valB) return this.dashSortAsc ? -1 : 1;
        if (valA > valB) return this.dashSortAsc ? 1 : -1;
        return 0;
      });

      return list;
    },

    get paginatedConsolidado() {
      const start = (this.dashPage - 1) * this.dashPerPage;
      return this.filteredConsolidado.slice(start, start + this.dashPerPage);
    },

    get totalPages() {
      return Math.ceil(this.filteredConsolidado.length / this.dashPerPage) || 1;
    },

    get dashMontoGranTotal() {
      return this.filteredConsolidado.reduce((sum, r) => sum + (r.precio_total || 0), 0);
    },

    get availableRenglones() {
      const list = this.dashboardData.consolidado || [];
      const set = new Set();
      list.forEach(r => {
        if (r.renglon) set.add(String(r.renglon).trim());
      });
      return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    },

    sortDashBy(col) {
      if (this.dashSortColumn === col) {
        this.dashSortAsc = !this.dashSortAsc;
      } else {
        this.dashSortColumn = col;
        this.dashSortAsc = true;
      }
    },

    filterByRenglonCard(renglonVal) {
      if (this.dashFilterRenglon === renglonVal) {
        this.dashFilterRenglon = ''; // Toggle off
      } else {
        this.dashFilterRenglon = renglonVal;
      }
      this.dashSubView = 'consolidado'; // Conmuta automáticamente al submódulo principal
      this.dashPage = 1;
    },

    toggleExpandDashRow(numero_pedido) {
      if (this.expandedDashPedido === numero_pedido) {
        this.expandedDashPedido = null;
      } else {
        this.expandedDashPedido = numero_pedido;
      }
    },

    exportDashboardCSV() {
      const data = this.filteredConsolidado;
      if (data.length === 0) {
        this.showToast('No hay datos para exportar con los filtros actuales.', 'warning');
        return;
      }

      let csv = 'No. Pedido,Fecha Pedido,No. Orden Compra,Codigo,Descripcion,Renglon,Cantidad,Estado,Fecha Ingreso,Precio Unitario,Precio Total\n';

      data.forEach(r => {
        const fPed = r.fecha_pedido_display || '';
        const oc = r.numero_orden_compra || 'Pendiente';
        const desc = `"${(r.descripcion_producto || '').replace(/"/g, '""')}"`;
        const fIng = r.fecha_ingreso_display || '';
        const pu = r.precio_unitario ? r.precio_unitario.toFixed(2) : '0.00';
        const pt = r.precio_total ? r.precio_total.toFixed(2) : '0.00';

        csv += `${r.numero_pedido},${fPed},${oc},${r.codigo},${desc},${r.renglon},${r.cantidad},${r.estado},${fIng},${pu},${pt}\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Consolidado_Compras_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      this.showToast('Reporte CSV descargado exitosamente.', 'success');
    },

    exportDashboardExcel() {
      const data = this.filteredConsolidado;
      if (!data || data.length === 0) {
        this.showToast('No hay datos filtrados para exportar a Excel.', 'warning');
        return;
      }
      const columnMap = {
        numero_pedido: 'No. Pedido',
        fecha_pedido_display: 'Fecha Pedido',
        numero_orden_compra: 'No. Órden Compra',
        codigo: 'Código Producto',
        descripcion_producto: 'Descripción Producto',
        renglon: 'Renglón',
        cantidad: 'Cantidad',
        estado: 'Estado Actual',
        fecha_ingreso_display: 'Fecha Ingreso',
        precio_unitario: 'Precio Unitario',
        precio_total: 'Monto Total'
      };
      window.exportToExcel(data, `Consolidado_Compras_${new Date().toISOString().split('T')[0]}.xlsx`, 'Consolidado Compras', columnMap);
      this.showToast('Reporte de Consolidado exportado a Excel (.xlsx) exitosamente.', 'success');
    },

    exportPedidosExcel() {
      const data = this.filteredPedidos;
      if (!data || data.length === 0) {
        this.showToast('No hay pedidos filtrados para exportar a Excel.', 'warning');
        return;
      }
      const columnMap = {
        numero_pedido: 'No. Pedido',
        fecha_pedido_display: 'Fecha Pedido',
        nombre_responsable: 'Responsable',
        codigo: 'Código Producto',
        descripcion_producto: 'Descripción Producto',
        cantidad: 'Cantidad',
        justificacion: 'Justificación',
        estado: 'Estado'
      };
      window.exportToExcel(data, `Pedidos_${new Date().toISOString().split('T')[0]}.xlsx`, 'Pedidos', columnMap);
      this.showToast('Listado de Pedidos exportado a Excel (.xlsx) exitosamente.', 'success');
    },

    exportOrdenesExcel() {
      const data = this.filteredOrdenes;
      if (!data || data.length === 0) {
        this.showToast('No hay órdenes de compra filtradas para exportar a Excel.', 'warning');
        return;
      }
      const columnMap = {
        numero_orden_compra: 'No. Órden Compra',
        numero_pedido: 'No. Pedido',
        codigo: 'Código Producto',
        descripcion_producto: 'Descripción Producto',
        nombre_tipo: 'Tipo Compra',
        fecha_orden_display: 'Fecha Órden',
        fecha_notificacion_display: 'Fecha Notificación',
        fecha_vencimiento_display: 'Fecha Vencimiento'
      };
      window.exportToExcel(data, `Ordenes_Compra_${new Date().toISOString().split('T')[0]}.xlsx`, 'Órdenes de Compra', columnMap);
      this.showToast('Órdenes de Compra exportadas a Excel (.xlsx) exitosamente.', 'success');
    },

    exportProductosExcel() {
      const data = this.filteredProductos;
      if (!data || data.length === 0) {
        this.showToast('No hay productos filtrados para exportar a Excel.', 'warning');
        return;
      }
      const columnMap = {
        codigo: 'Código Producto',
        descripcion: 'Descripción / Nombre',
        renglon: 'Renglón Presupuestario'
      };
      window.exportToExcel(data, `Catalogo_Productos_${new Date().toISOString().split('T')[0]}.xlsx`, 'Productos', columnMap);
      this.showToast('Catálogo de Productos exportado a Excel (.xlsx) exitosamente.', 'success');
    },

    exportProveedoresExcel() {
      const data = this.filteredProveedores;
      if (!data || data.length === 0) {
        this.showToast('No hay proveedores filtrados para exportar a Excel.', 'warning');
        return;
      }
      const columnMap = {
        nit: 'NIT Proveedor',
        nombre_proveedor: 'Nombre o Razón Social'
      };
      window.exportToExcel(data, `Catalogo_Proveedores_${new Date().toISOString().split('T')[0]}.xlsx`, 'Proveedores', columnMap);
      this.showToast('Catálogo de Proveedores exportado a Excel (.xlsx) exitosamente.', 'success');
    },

    exportEntregaOrdenesExcel() {
      const data = this.filteredEntregaOrdenes;
      if (!data || data.length === 0) {
        this.showToast('No hay entregas filtradas para exportar a Excel.', 'warning');
        return;
      }
      const columnMap = {
        numero_orden_compra: 'No. Órden Compra',
        numero_pedido: 'No. Pedido',
        codigo: 'Código Producto',
        descripcion_producto: 'Descripción Producto',
        nombre_usuario_entrego: 'Entregado por',
        fecha_entrega_display: 'Fecha Entrega',
        nombre_usuario_recibio: 'Recibido por',
        fecha_recepcion_display: 'Fecha Recepción'
      };
      window.exportToExcel(data, `Seguimiento_Entregas_${new Date().toISOString().split('T')[0]}.xlsx`, 'Entregas', columnMap);
      this.showToast('Seguimiento de Entregas exportado a Excel (.xlsx) exitosamente.', 'success');
    },

    exportEntregaExpedientesExcel() {
      const data = this.filteredEntregaExpedientes;
      if (!data || data.length === 0) {
        this.showToast('No hay expedientes filtrados para exportar a Excel.', 'warning');
        return;
      }
      const columnMap = {
        numero_orden_compra: 'No. Órden Compra',
        numero_pedido: 'No. Pedido',
        codigo: 'Código Producto',
        descripcion_producto: 'Descripción Producto',
        nombre_usuario_expediente: 'Entregado por',
        fecha_entrega_expediente_display: 'Fecha Entrega Expediente'
      };
      window.exportToExcel(data, `Entrega_Expedientes_${new Date().toISOString().split('T')[0]}.xlsx`, 'Expedientes', columnMap);
      this.showToast('Control de Expedientes exportado a Excel (.xlsx) exitosamente.', 'success');
    },


    // --- USUARIOS & ROLES ---
    async loadUsuarios() {
      try {
        this.usuariosList = await this.fetchAuth('/api/usuarios');
        this.rolesList = await this.fetchAuth('/api/usuarios/roles');
      } catch (err) {
        this.showToast(err.message, 'error');
      }
    },

    async saveUsuario() {
      try {
        const res = await this.fetchAuth('/api/usuarios', {
          method: 'POST',
          body: JSON.stringify(this.newUsuario)
        });
        this.showToast(res.message, 'success');
        this.showUsuarioModal = false;
        this.newUsuario = { id_usuario: '', nombre_completo: '', usuario: '', password: '', roles: [] };
        this.loadUsuarios();
      } catch (err) {
        this.showToast(err.message, 'error');
      }
    },

    openEditUsuario(userObj) {
      let roleArray = [];
      if (Array.isArray(userObj.roles) && userObj.roles.length > 0) {
        roleArray = userObj.roles.map(r => parseInt(r, 10));
      } else if (userObj.roles_ids) {
        roleArray = String(userObj.roles_ids).split(',').map(r => parseInt(r, 10)).filter(n => !isNaN(n));
      }

      this.editUsuario = {
        id_usuario: userObj.id_usuario,
        nombre_completo: userObj.nombre_completo,
        usuario: userObj.usuario,
        roles: roleArray
      };
      this.showEditUsuarioModal = true;
    },

    isEditRoleSelected(id_rol) {
      if (!this.editUsuario || !Array.isArray(this.editUsuario.roles)) return false;
      const targetId = parseInt(id_rol, 10);
      return this.editUsuario.roles.some(r => parseInt(r, 10) === targetId);
    },

    toggleEditRole(id_rol) {
      const targetId = parseInt(id_rol, 10);
      if (!Array.isArray(this.editUsuario.roles)) {
        this.editUsuario.roles = [];
      }
      const idx = this.editUsuario.roles.findIndex(r => parseInt(r, 10) === targetId);
      if (idx >= 0) {
        this.editUsuario.roles.splice(idx, 1);
      } else {
        this.editUsuario.roles.push(targetId);
      }
    },

    isNewRoleSelected(id_rol) {
      if (!this.newUsuario || !Array.isArray(this.newUsuario.roles)) return false;
      const targetId = parseInt(id_rol, 10);
      return this.newUsuario.roles.some(r => parseInt(r, 10) === targetId);
    },

    toggleNewRole(id_rol) {
      const targetId = parseInt(id_rol, 10);
      if (!Array.isArray(this.newUsuario.roles)) {
        this.newUsuario.roles = [];
      }
      const idx = this.newUsuario.roles.findIndex(r => parseInt(r, 10) === targetId);
      if (idx >= 0) {
        this.newUsuario.roles.splice(idx, 1);
      } else {
        this.newUsuario.roles.push(targetId);
      }
    },

    async updateUsuario() {
      try {
        const res = await this.fetchAuth(`/api/usuarios/${this.editUsuario.id_usuario}`, {
          method: 'PUT',
          body: JSON.stringify(this.editUsuario)
        });
        this.showToast(res.message, 'success');
        this.showEditUsuarioModal = false;
        this.loadUsuarios();
      } catch (err) {
        this.showToast(err.message, 'error');
      }
    },

    openPasswordModal(userObj) {
      this.passwordData = {
        id_usuario: userObj.id_usuario,
        nombre_completo: userObj.nombre_completo,
        password: ''
      };
      this.showPasswordModal = true;
    },

    async savePassword() {
      if (!this.passwordData.password) {
        this.showToast('Ingrese la nueva contraseña.', 'warning');
        return;
      }
      try {
        const res = await this.fetchAuth(`/api/usuarios/${this.passwordData.id_usuario}/password`, {
          method: 'PUT',
          body: JSON.stringify({ password: this.passwordData.password })
        });
        this.showToast(res.message, 'success');
        this.showPasswordModal = false;
      } catch (err) {
        this.showToast(err.message, 'error');
      }
    },

    async deleteUsuario(id_usuario, nombre_completo) {
      if (!confirm(`¿Está seguro de que desea eliminar al usuario "${nombre_completo}" (${id_usuario})? Esta acción no se puede deshacer.`)) {
        return;
      }
      try {
        const res = await this.fetchAuth(`/api/usuarios/${id_usuario}`, {
          method: 'DELETE'
        });
        this.showToast(res.message, 'success');
        this.loadUsuarios();
      } catch (err) {
        this.showToast(err.message, 'error');
      }
    },

    // --- CATÁLOGOS ---
    async loadProductos() {
      try {
        const raw = await this.fetchAuth('/api/catalogos/productos');
        if (Array.isArray(raw)) {
          raw.sort((a, b) => {
            const numA = parseInt(a.codigo, 10);
            const numB = parseInt(b.codigo, 10);
            if (!isNaN(numA) && !isNaN(numB)) {
              return numA - numB;
            }
            return String(a.codigo).localeCompare(String(b.codigo), undefined, { numeric: true });
          });
          this.productosList = raw;
        }
      } catch (e) {}
    },
    get filteredProductos() {
      if (!this.productoSearch || !this.productoSearch.trim()) {
        return this.productosList;
      }
      const term = this.productoSearch.toLowerCase().trim();
      return this.productosList.filter(p => 
        (p.codigo && String(p.codigo).toLowerCase().includes(term)) ||
        (p.descripcion && p.descripcion.toLowerCase().includes(term)) ||
        (p.renglon && String(p.renglon).toLowerCase().includes(term))
      );
    },
    get totalProductoPages() {
      return Math.ceil(this.filteredProductos.length / this.productoPerPage) || 1;
    },
    get paginatedProductos() {
      const start = (this.productoPage - 1) * this.productoPerPage;
      return this.filteredProductos.slice(start, start + this.productoPerPage);
    },
    async saveProducto() {
      try {
        const res = await this.fetchAuth('/api/catalogos/productos', { method: 'POST', body: JSON.stringify(this.newProducto) });
        this.showToast(res.message, 'success');
        this.showProductoModal = false;
        this.newProducto = { codigo: '', descripcion: '', renglon: '' };
        this.loadProductos();
      } catch (e) { this.showToast(e.message, 'error'); }
    },
    openEditProducto(p) {
      this.editProducto = { codigo: p.codigo, descripcion: p.descripcion, renglon: p.renglon };
      this.showEditProductoModal = true;
    },
    async updateProducto() {
      try {
        const res = await this.fetchAuth(`/api/catalogos/productos/${this.editProducto.codigo}`, {
          method: 'PUT',
          body: JSON.stringify(this.editProducto)
        });
        this.showToast(res.message, 'success');
        this.showEditProductoModal = false;
        this.loadProductos();
      } catch (err) {
        this.showToast(err.message, 'error');
      }
    },
    async deleteProducto(codigo, descripcion) {
      if (!confirm(`¿Está seguro de que desea eliminar el producto "${descripcion}" (${codigo})?`)) {
        return;
      }
      try {
        const res = await this.fetchAuth(`/api/catalogos/productos/${codigo}`, {
          method: 'DELETE'
        });
        this.showToast(res.message, 'success');
        this.loadProductos();
      } catch (err) {
        this.showToast(err.message, 'error');
      }
    },
    async uploadExcelProductos(e) {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const { jsonData, rawRows } = await window.readExcelFile(file);
        let items = [];

        // 1. Parseo por encabezados o sinonimia de llaves
        if (Array.isArray(jsonData) && jsonData.length > 0) {
          items = jsonData.map(r => {
            const norm = window.normalizeExcelKeys(r);
            const codigo = norm.codigo || norm.code || norm.cod || norm.id || norm.codigo_producto || norm.c_digo || r.codigo;
            const descripcion = norm.descripcion || norm.description || norm.desc || norm.nombre || norm.detalle || norm.producto || r.descripcion;
            const renglon = norm.renglon || norm.linea || norm.partida || r.renglon;
            return { codigo, descripcion, renglon };
          }).filter(item => item.codigo && item.descripcion);
        }

        // 2. Fallback por posición de columnas (Fila 1 en adelante -> Col 0: Código, Col 1: Descripción, Col 2: Renglón)
        if (items.length === 0 && Array.isArray(rawRows) && rawRows.length > 1) {
          for (let i = 1; i < rawRows.length; i++) {
            const row = rawRows[i];
            if (!row || row.length < 2) continue;
            const codigo = row[0] !== undefined ? String(row[0]).trim() : '';
            const descripcion = row[1] !== undefined ? String(row[1]).trim() : '';
            const renglon = row[2] !== undefined ? String(row[2]).trim() : '';
            if (codigo && descripcion) {
              items.push({ codigo, descripcion, renglon });
            }
          }
        }

        if (items.length === 0) {
          throw new Error('No se pudieron extraer productos válidos. Verifique que el Excel contenga datos en las columnas de Código y Descripción.');
        }

        const res = await this.fetchAuth('/api/catalogos/productos/bulk', { method: 'POST', body: JSON.stringify({ items }) });
        this.showToast(res.message, 'success');
        this.loadProductos();
      } catch (err) { this.showToast(err.message, 'error'); }
      e.target.value = '';
    },

    async loadResponsables() {
      try { this.responsablesList = await this.fetchAuth('/api/catalogos/responsables'); } catch (e) {}
    },
    async saveResponsable() {
      try {
        const res = await this.fetchAuth('/api/catalogos/responsables', { method: 'POST', body: JSON.stringify(this.newResponsable) });
        this.showToast(res.message, 'success');
        this.showResponsableModal = false;
        this.newResponsable = { id_responsable: '', nombre_completo: '' };
        this.loadResponsables();
      } catch (e) { this.showToast(e.message, 'error'); }
    },
    openEditResponsable(r) {
      this.editResponsable = { id_responsable: r.id_responsable, nombre_completo: r.nombre_completo };
      this.showEditResponsableModal = true;
    },
    async updateResponsable() {
      try {
        const res = await this.fetchAuth(`/api/catalogos/responsables/${this.editResponsable.id_responsable}`, {
          method: 'PUT',
          body: JSON.stringify(this.editResponsable)
        });
        this.showToast(res.message, 'success');
        this.showEditResponsableModal = false;
        this.loadResponsables();
      } catch (err) {
        this.showToast(err.message, 'error');
      }
    },
    async deleteResponsable(id_responsable, nombre_completo) {
      if (!confirm(`¿Está seguro de que desea eliminar al responsable "${nombre_completo}" (${id_responsable})?`)) {
        return;
      }
      try {
        const res = await this.fetchAuth(`/api/catalogos/responsables/${id_responsable}`, {
          method: 'DELETE'
        });
        this.showToast(res.message, 'success');
        this.loadResponsables();
      } catch (err) {
        this.showToast(err.message, 'error');
      }
    },

    async loadTiposCompra() {
      try { this.tiposCompraList = await this.fetchAuth('/api/catalogos/tipocompra'); } catch (e) {}
    },
    async saveTipoCompra() {
      try {
        const res = await this.fetchAuth('/api/catalogos/tipocompra', { method: 'POST', body: JSON.stringify(this.newTipoCompra) });
        this.showToast(res.message, 'success');
        this.showTipoCompraModal = false;
        this.newTipoCompra = { id_tipo_compra: '', nombre_tipo: '' };
        this.loadTiposCompra();
      } catch (e) { this.showToast(e.message, 'error'); }
    },
    openEditTipoCompra(tc) {
      this.editTipoCompra = { id_tipo_compra: tc.id_tipo_compra, nombre_tipo: tc.nombre_tipo };
      this.showEditTipoCompraModal = true;
    },
    async updateTipoCompra() {
      try {
        const res = await this.fetchAuth(`/api/catalogos/tipocompra/${this.editTipoCompra.id_tipo_compra}`, {
          method: 'PUT',
          body: JSON.stringify(this.editTipoCompra)
        });
        this.showToast(res.message, 'success');
        this.showEditTipoCompraModal = false;
        this.loadTiposCompra();
      } catch (err) {
        this.showToast(err.message, 'error');
      }
    },
    async deleteTipoCompra(id_tipo_compra, nombre_tipo) {
      if (!confirm(`¿Está seguro de que desea eliminar el tipo de compra "${nombre_tipo}" (${id_tipo_compra})?`)) {
        return;
      }
      try {
        const res = await this.fetchAuth(`/api/catalogos/tipocompra/${id_tipo_compra}`, {
          method: 'DELETE'
        });
        this.showToast(res.message, 'success');
        this.loadTiposCompra();
      } catch (err) {
        this.showToast(err.message, 'error');
      }
    },

    async loadProveedores() {
      try { this.proveedoresList = await this.fetchAuth('/api/catalogos/proveedores'); } catch (e) {}
    },
    get filteredProveedores() {
      if (!this.proveedorSearch || !this.proveedorSearch.trim()) {
        return this.proveedoresList;
      }
      const term = this.proveedorSearch.toLowerCase().trim();
      return this.proveedoresList.filter(p => 
        (p.nit && String(p.nit).toLowerCase().includes(term)) ||
        (p.nombre_proveedor && p.nombre_proveedor.toLowerCase().includes(term))
      );
    },
    get totalProveedorPages() {
      return Math.ceil(this.filteredProveedores.length / this.proveedorPerPage) || 1;
    },
    get paginatedProveedores() {
      const start = (this.proveedorPage - 1) * this.proveedorPerPage;
      return this.filteredProveedores.slice(start, start + this.proveedorPerPage);
    },
    async saveProveedor() {
      try {
        const res = await this.fetchAuth('/api/catalogos/proveedores', { method: 'POST', body: JSON.stringify(this.newProveedor) });
        this.showToast(res.message, 'success');
        this.showProveedorModal = false;
        this.newProveedor = { nit: '', nombre_proveedor: '' };
        this.loadProveedores();
      } catch (e) { this.showToast(e.message, 'error'); }
    },
    openEditProveedor(p) {
      this.editProveedor = { nit: p.nit, nombre_proveedor: p.nombre_proveedor };
      this.showEditProveedorModal = true;
    },
    async updateProveedor() {
      try {
        const res = await this.fetchAuth(`/api/catalogos/proveedores/${this.editProveedor.nit}`, {
          method: 'PUT',
          body: JSON.stringify(this.editProveedor)
        });
        this.showToast(res.message, 'success');
        this.showEditProveedorModal = false;
        this.loadProveedores();
      } catch (err) {
        this.showToast(err.message, 'error');
      }
    },
    async deleteProveedor(nit, nombre_proveedor) {
      if (!confirm(`¿Está seguro de que desea eliminar al proveedor "${nombre_proveedor}" (NIT: ${nit})?`)) {
        return;
      }
      try {
        const res = await this.fetchAuth(`/api/catalogos/proveedores/${nit}`, {
          method: 'DELETE'
        });
        this.showToast(res.message, 'success');
        this.loadProveedores();
      } catch (err) {
        this.showToast(err.message, 'error');
      }
    },
    async uploadExcelProveedores(e) {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const { jsonData, rawRows } = await window.readExcelFile(file);
        let items = [];

        if (Array.isArray(jsonData) && jsonData.length > 0) {
          items = jsonData.map(r => {
            const norm = window.normalizeExcelKeys(r);
            return {
              nit: norm.nit || norm.nit_proveedor || norm.id || r.nit,
              nombre_proveedor: norm.nombre_proveedor || norm.nombre || norm.proveedor || norm.empresa || r.nombre_proveedor
            };
          }).filter(item => item.nit && item.nombre_proveedor);
        }

        if (items.length === 0 && Array.isArray(rawRows) && rawRows.length > 1) {
          for (let i = 1; i < rawRows.length; i++) {
            const row = rawRows[i];
            if (!row || row.length < 2) continue;
            const nit = row[0] !== undefined ? String(row[0]).trim() : '';
            const nombre_proveedor = row[1] !== undefined ? String(row[1]).trim() : '';
            if (nit && nombre_proveedor) {
              items.push({ nit, nombre_proveedor });
            }
          }
        }

        if (items.length === 0) {
          throw new Error('No se encontraron proveedores válidos en el archivo Excel.');
        }

        const res = await this.fetchAuth('/api/catalogos/proveedores/bulk', { method: 'POST', body: JSON.stringify({ items }) });
        this.showToast(res.message, 'success');
        this.loadProveedores();
      } catch (err) { this.showToast(err.message, 'error'); }
      e.target.value = '';
    },

    // --- PEDIDOS ---
    async loadPedidos() {
      try { this.pedidosList = await this.fetchAuth('/api/pedidos'); } catch (e) { this.showToast(e.message, 'error'); }
    },
    sortPedidosBy(key) {
      if (this.pedidoSortKey === key) {
        this.pedidoSortDir = this.pedidoSortDir === 'asc' ? 'desc' : 'asc';
      } else {
        this.pedidoSortKey = key;
        this.pedidoSortDir = 'asc';
      }
    },
    get filteredPedidos() {
      let list = [...this.pedidosList];

      if (this.pedidoSearch && this.pedidoSearch.trim()) {
        const term = this.pedidoSearch.toLowerCase().trim();
        list = list.filter(p =>
          String(p.numero_pedido).toLowerCase().includes(term) ||
          (p.codigo && String(p.codigo).toLowerCase().includes(term)) ||
          (p.descripcion_producto && p.descripcion_producto.toLowerCase().includes(term)) ||
          (p.justificacion && p.justificacion.toLowerCase().includes(term)) ||
          (p.nombre_responsable && p.nombre_responsable.toLowerCase().includes(term)) ||
          (p.fecha_pedido_display && p.fecha_pedido_display.includes(term))
        );
      }

      const key = this.pedidoSortKey;
      const mult = this.pedidoSortDir === 'asc' ? 1 : -1;

      list.sort((a, b) => {
        let valA = a[key];
        let valB = b[key];

        if (valA === undefined || valA === null) valA = '';
        if (valB === undefined || valB === null) valB = '';

        if (typeof valA === 'number' && typeof valB === 'number') {
          return (valA - valB) * mult;
        }

        return String(valA).localeCompare(String(valB), undefined, { numeric: true }) * mult;
      });

      return list;
    },
    get totalPedidoPages() {
      return Math.ceil(this.filteredPedidos.length / this.pedidoPerPage) || 1;
    },
    get paginatedPedidos() {
      const start = (this.pedidoPage - 1) * this.pedidoPerPage;
      return this.filteredPedidos.slice(start, start + this.pedidoPerPage);
    },
    async savePedido() {
      try {
        const res = await this.fetchAuth('/api/pedidos', {
          method: 'POST',
          body: JSON.stringify(this.newPedido)
        });
        this.showToast(res.message, 'success');
        this.showPedidoModal = false;
        this.newPedido = { numero_pedido: '', fecha_pedido: new Date().toISOString().split('T')[0], codigo: '', cantidad: 1, justificacion: '' };
        this.loadPedidos();
      } catch (err) {
        this.showToast(err.message, 'error');
      }
    },
    openEditPedido(p) {
      this.editPedido = {
        numero_pedido: p.numero_pedido,
        fecha_pedido: p.fecha_pedido_display || p.fecha_pedido,
        codigo: p.codigo,
        cantidad: p.cantidad,
        justificacion: p.justificacion,
        id_responsable: p.id_responsable || ''
      };
      this.showEditPedidoModal = true;
    },
    async updatePedido() {
      try {
        const res = await this.fetchAuth(`/api/pedidos/${this.editPedido.numero_pedido}`, {
          method: 'PUT',
          body: JSON.stringify(this.editPedido)
        });
        this.showToast(res.message, 'success');
        this.showEditPedidoModal = false;
        this.loadPedidos();
      } catch (err) {
        this.showToast(err.message, 'error');
      }
    },
    async deletePedido(numero_pedido) {
      if (!confirm(`¿Está seguro de que desea eliminar el Pedido No. ${numero_pedido}?`)) {
        return;
      }
      try {
        const res = await this.fetchAuth(`/api/pedidos/${numero_pedido}`, {
          method: 'DELETE'
        });
        this.showToast(res.message, 'success');
        this.loadPedidos();
      } catch (err) {
        this.showToast(err.message, 'error');
      }
    },
    async uploadExcelPedidos(e) {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const { jsonData, rawRows } = await window.readExcelFile(file);
        let items = [];

        if (Array.isArray(jsonData) && jsonData.length > 0) {
          items = jsonData.map(r => {
            const norm = window.normalizeExcelKeys(r);
            return {
              numero_pedido: norm.numero_pedido || norm.pedido || norm.no_pedido || r.numero_pedido,
              fecha_pedido: norm.fecha_pedido || norm.fecha || r.fecha_pedido,
              codigo: norm.codigo || norm.codigo_producto || norm.producto || r.codigo,
              cantidad: norm.cantidad || norm.cant || r.cantidad,
              justificacion: norm.justificacion || norm.motivo || r.justificacion || 'Carga Masiva Excel'
            };
          }).filter(item => item.numero_pedido && item.codigo && item.cantidad);
        }

        if (items.length === 0 && Array.isArray(rawRows) && rawRows.length > 1) {
          for (let i = 1; i < rawRows.length; i++) {
            const row = rawRows[i];
            if (!row || row.length < 4) continue;
            const numero_pedido = row[0] !== undefined ? String(row[0]).trim() : '';
            const fecha_pedido = row[1] !== undefined ? String(row[1]).trim() : '';
            const codigo = row[2] !== undefined ? String(row[2]).trim() : '';
            const cantidad = row[3] !== undefined ? String(row[3]).trim() : '';
            const justificacion = row[4] !== undefined ? String(row[4]).trim() : 'Carga Masiva Excel';
            if (numero_pedido && codigo && cantidad) {
              items.push({ numero_pedido, fecha_pedido, codigo, cantidad, justificacion });
            }
          }
        }

        if (items.length === 0) {
          throw new Error('No se pudieron extraer pedidos válidos del archivo Excel.');
        }

        const res = await this.fetchAuth('/api/pedidos/bulk', { method: 'POST', body: JSON.stringify({ items }) });
        this.showToast(res.message, 'success');
        this.loadPedidos();
      } catch (err) { this.showToast(err.message, 'error'); }
      e.target.value = '';
    },

    // Asignación de Responsable
    async loadAsignaciones() {
      try {
        await this.loadResponsables();
        const pending = await this.fetchAuth('/api/pedidos/sin-responsable');
        this.asignacionesList = pending.map(item => ({
          ...item,
          id_responsable: ''
        }));
        this.hasUnsavedChanges = false;
      } catch (err) {
        this.showToast(err.message, 'error');
      }
    },

    markAsignacionChanged() {
      this.hasUnsavedChanges = true;
    },

    async saveAsignaciones() {
      const toSave = this.asignacionesList
        .filter(item => item.id_responsable && item.id_responsable.trim() !== '')
        .map(item => ({
          numero_pedido: item.numero_pedido,
          id_responsable: item.id_responsable
        }));

      if (toSave.length === 0) {
        this.showToast('No se ha asignado ningún responsable.', 'warning');
        return;
      }

      try {
        const res = await this.fetchAuth('/api/pedidos/asignar-responsable', {
          method: 'POST',
          body: JSON.stringify({ asignaciones: toSave })
        });
        this.showToast(res.message, 'success');
        this.hasUnsavedChanges = false;
        this.loadAsignaciones();
      } catch (err) {
        this.showToast(err.message, 'error');
      }
    },

    // --- EJECUCIÓN COMPRAS ---
    // Orden Compra
    async loadOrdenes() {
      try { this.ordenesList = await this.fetchAuth('/api/compras/ordenes'); } catch (e) { this.showToast(e.message, 'error'); }
    },
    get filteredOrdenes() {
      let list = [...this.ordenesList];
      if (this.ordenSearch && this.ordenSearch.trim()) {
        const term = this.ordenSearch.toLowerCase().trim();
        list = list.filter(o => 
          (o.numero_orden_compra && String(o.numero_orden_compra).toLowerCase().includes(term)) ||
          (o.numero_pedido && String(o.numero_pedido).toLowerCase().includes(term)) ||
          (o.codigo && String(o.codigo).toLowerCase().includes(term)) ||
          (o.descripcion_producto && o.descripcion_producto.toLowerCase().includes(term)) ||
          (o.nombre_tipo && o.nombre_tipo.toLowerCase().includes(term))
        );
      }
      const key = this.ordenSortKey;
      const dir = this.ordenSortDir === 'asc' ? 1 : -1;
      list.sort((a, b) => {
        let valA = a[key];
        let valB = b[key];
        if (valA === null || valA === undefined) valA = '';
        if (valB === null || valB === undefined) valB = '';
        if (typeof valA === 'number' && typeof valB === 'number') {
          return (valA - valB) * dir;
        }
        return String(valA).localeCompare(String(valB), undefined, { numeric: true, sensitivity: 'base' }) * dir;
      });
      return list;
    },
    get totalOrdenPages() {
      return Math.ceil(this.filteredOrdenes.length / this.ordenPerPage) || 1;
    },
    get paginatedOrdenes() {
      const start = (this.ordenPage - 1) * this.ordenPerPage;
      return this.filteredOrdenes.slice(start, start + this.ordenPerPage);
    },
    get selectedPedidoForNewOrden() {
      if (!this.newOrden.numero_pedido) return null;
      return this.pedidosList.find(p => String(p.numero_pedido) === String(this.newOrden.numero_pedido)) || null;
    },
    get selectedPedidoForEditOrden() {
      if (!this.editOrden.numero_pedido) return null;
      return this.pedidosList.find(p => String(p.numero_pedido) === String(this.editOrden.numero_pedido)) || null;
    },
    get availablePedidosForNewOrden() {
      const pedidosConOrden = new Set(
        (this.ordenesList || [])
          .map(o => (o.numero_pedido != null ? String(o.numero_pedido).trim() : null))
          .filter(Boolean)
      );
      return (this.pedidosList || []).filter(p => !pedidosConOrden.has(String(p.numero_pedido).trim()));
    },
    get filteredPedidosForModal() {
      const baseList = this.availablePedidosForNewOrden;
      if (!this.pedidoSearchModal && this.pedidoSearchModal !== 0) {
        return baseList;
      }
      const raw = String(this.pedidoSearchModal);
      const isExact = raw.endsWith(' ');
      const term = raw.trim().toLowerCase();

      if (!term) {
        return baseList;
      }

      if (isExact) {
        return baseList.filter(p => String(p.numero_pedido).toLowerCase() === term);
      }

      return baseList.filter(p => 
        String(p.numero_pedido).toLowerCase().startsWith(term) ||
        (p.codigo && String(p.codigo).toLowerCase().includes(term)) ||
        (p.descripcion_producto && p.descripcion_producto.toLowerCase().includes(term))
      );
    },
    sortOrdenesBy(key) {
      if (this.ordenSortKey === key) {
        this.ordenSortDir = this.ordenSortDir === 'asc' ? 'desc' : 'asc';
      } else {
        this.ordenSortKey = key;
        this.ordenSortDir = 'asc';
      }
    },
    openCreateOrdenModal() {
      this.loadPedidos();
      this.loadTiposCompra();
      this.loadOrdenes();
      this.pedidoSearchModal = '';
      this.pedidoDropdownOpen = false;
      this.newOrden = {
        numero_orden_compra: '',
        numero_pedido: '',
        id_tipo_compra: 'BC',
        fecha_orden: new Date().toISOString().split('T')[0],
        fecha_notificacion: '',
        fecha_vencimiento: ''
      };
      this.showOrdenModal = true;
    },
    async saveOrden() {
      try {
        const res = await this.fetchAuth('/api/compras/ordenes', {
          method: 'POST',
          body: JSON.stringify(this.newOrden)
        });
        this.showToast(res.message, 'success');
        this.showOrdenModal = false;
        this.loadOrdenes();
      } catch (err) {
        this.showToast(err.message, 'error');
      }
    },
    openEditOrden(o) {
      this.loadPedidos();
      this.loadTiposCompra();
      this.editOrden = {
        numero_orden_compra: String(o.numero_orden_compra).trim(),
        numero_pedido: o.numero_pedido,
        id_tipo_compra: o.id_tipo_compra ? String(o.id_tipo_compra).trim() : 'BC',
        fecha_orden: o.fecha_orden_display || o.fecha_orden,
        fecha_notificacion: o.fecha_notificacion_display || o.fecha_notificacion,
        fecha_vencimiento: o.fecha_vencimiento_display || o.fecha_vencimiento
      };
      this.showEditOrdenModal = true;
    },
    async updateOrden() {
      try {
        const res = await this.fetchAuth(`/api/compras/ordenes/${this.editOrden.numero_orden_compra}`, {
          method: 'PUT',
          body: JSON.stringify(this.editOrden)
        });
        this.showToast(res.message, 'success');
        this.showEditOrdenModal = false;
        this.loadOrdenes();
      } catch (err) {
        this.showToast(err.message, 'error');
      }
    },
    async deleteOrden(numero_orden_compra) {
      if (!confirm(`¿Está seguro de que desea eliminar la Orden de Compra No. ${numero_orden_compra}?`)) {
        return;
      }
      try {
        const res = await this.fetchAuth(`/api/compras/ordenes/${numero_orden_compra}`, {
          method: 'DELETE'
        });
        this.showToast(res.message, 'success');
        this.loadOrdenes();
      } catch (err) {
        this.showToast(err.message, 'error');
      }
    },
    async uploadExcelOrdenes(e) {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const { jsonData, rawRows } = await window.readExcelFile(file);
        let items = [];

        if (Array.isArray(jsonData) && jsonData.length > 0) {
          items = jsonData.map(r => {
            const norm = window.normalizeExcelKeys(r);
            return {
              numero_pedido: norm.numero_pedido || norm.pedido || norm.no_pedido || r.numero_pedido,
              numero_orden_compra: norm.numero_orden_compra || norm.orden || norm.no_orden || r.numero_orden_compra,
              id_tipo_compra: norm.id_tipo_compra || norm.tipo || norm.tipo_compra || r.id_tipo_compra,
              fecha_orden: norm.fecha_orden || norm.fecha || r.fecha_orden,
              fecha_notificacion: norm.fecha_notificacion || norm.notificacion || r.fecha_notificacion,
              fecha_vencimiento: norm.fecha_vencimiento || norm.vencimiento || r.fecha_vencimiento
            };
          }).filter(item => item.numero_pedido && item.numero_orden_compra);
        }

        if (items.length === 0 && Array.isArray(rawRows) && rawRows.length > 1) {
          for (let i = 1; i < rawRows.length; i++) {
            const row = rawRows[i];
            if (!row || row.length < 3) continue;
            const numero_pedido = row[0] !== undefined ? String(row[0]).trim() : '';
            const numero_orden_compra = row[1] !== undefined ? String(row[1]).trim() : '';
            const id_tipo_compra = row[2] !== undefined ? String(row[2]).trim() : '';
            const fecha_orden = row[3] !== undefined ? String(row[3]).trim() : '';
            const fecha_notificacion = row[4] !== undefined ? String(row[4]).trim() : '';
            const fecha_vencimiento = row[5] !== undefined ? String(row[5]).trim() : '';
            if (numero_pedido && numero_orden_compra) {
              items.push({ numero_pedido, numero_orden_compra, id_tipo_compra, fecha_orden, fecha_notificacion, fecha_vencimiento });
            }
          }
        }

        if (items.length === 0) {
          throw new Error('No se pudieron extraer órdenes de compra válidas del archivo Excel.');
        }

        const res = await this.fetchAuth('/api/compras/ordenes/bulk', { method: 'POST', body: JSON.stringify({ items }) });
        this.showToast(res.message, 'success');
        this.loadOrdenes();
      } catch (err) { this.showToast(err.message, 'error'); }
      e.target.value = '';
    },

    // Entrega Orden Compra
    async loadEntregaOrdenes() {
      try { this.entregaOrdenesList = await this.fetchAuth('/api/compras/entrega-orden'); } catch (e) { this.showToast(e.message, 'error'); }
    },
    get filteredEntregaOrdenes() {
      let list = [...this.entregaOrdenesList];

      // Filtro "Solo pendientes de entregar" (Encargado de pedidos)
      if (this.soloPendientesEntrega) {
        list = list.filter(item => !item.fecha_entrega && !item.fecha_entrega_display);
      }

      // Filtro "Solo pendientes de recibir" (Encargado de ingresos)
      if (this.soloPendientesRecepcion) {
        list = list.filter(item => (item.fecha_entrega || item.fecha_entrega_display) && (!item.fecha_recepcion && !item.fecha_recepcion_display));
      }

      // Buscador
      if (this.entregaOrdenSearch && this.entregaOrdenSearch.trim()) {
        const term = this.entregaOrdenSearch.toLowerCase().trim();
        list = list.filter(item => 
          (item.numero_pedido && String(item.numero_pedido).toLowerCase().includes(term)) ||
          (item.numero_orden_compra && String(item.numero_orden_compra).toLowerCase().includes(term)) ||
          (item.descripcion_producto && item.descripcion_producto.toLowerCase().includes(term)) ||
          (item.usuario && item.usuario.toLowerCase().includes(term)) ||
          (item.usuario_entrego && item.usuario_entrego.toLowerCase().includes(term)) ||
          (item.nombre_usuario_entrego && item.nombre_usuario_entrego.toLowerCase().includes(term)) ||
          (item.nombre_usuario_recibio && item.nombre_usuario_recibio.toLowerCase().includes(term))
        );
      }

      // Ordenamiento por cualquier columna (default: numero_pedido o fecha_orden)
      const key = this.entregaOrdenSortKey;
      const dir = this.entregaOrdenSortDir === 'asc' ? 1 : -1;
      list.sort((a, b) => {
        let valA = a[key];
        let valB = b[key];
        if (valA === null || valA === undefined) valA = '';
        if (valB === null || valB === undefined) valB = '';
        if (typeof valA === 'number' && typeof valB === 'number') {
          return (valA - valB) * dir;
        }
        return String(valA).localeCompare(String(valB), undefined, { numeric: true, sensitivity: 'base' }) * dir;
      });

      return list;
    },
    get totalEntregaOrdenPages() {
      return Math.ceil(this.filteredEntregaOrdenes.length / this.entregaOrdenPerPage) || 1;
    },
    get paginatedEntregaOrdenes() {
      const start = (this.entregaOrdenPage - 1) * this.entregaOrdenPerPage;
      return this.filteredEntregaOrdenes.slice(start, start + this.entregaOrdenPerPage);
    },
    sortEntregaOrdenesBy(key) {
      if (this.entregaOrdenSortKey === key) {
        this.entregaOrdenSortDir = this.entregaOrdenSortDir === 'asc' ? 'desc' : 'asc';
      } else {
        this.entregaOrdenSortKey = key;
        this.entregaOrdenSortDir = 'asc';
      }
    },
    async registrarEntrega(numero_orden_compra) {
      try {
        const res = await this.fetchAuth('/api/compras/entrega-orden', {
          method: 'POST',
          body: JSON.stringify({ numero_orden_compra })
        });
        this.showToast(res.message, 'success');
        this.loadEntregaOrdenes();
      } catch (e) { this.showToast(e.message, 'error'); }
    },
    async registrarRecepcion(numero_orden_compra) {
      try {
        const res = await this.fetchAuth('/api/compras/recepcion-orden', {
          method: 'POST',
          body: JSON.stringify({ numero_orden_compra })
        });
        this.showToast(res.message, 'success');
        this.loadEntregaOrdenes();
      } catch (e) { this.showToast(e.message, 'error'); }
    },
    async eliminarEntrega(numero_orden_compra) {
      if (!confirm(`¿Está seguro de que desea eliminar el registro de Entrega para la orden ${numero_orden_compra}?`)) return;
      try {
        const res = await this.fetchAuth(`/api/compras/entrega-orden/${numero_orden_compra}/entrega`, { method: 'DELETE' });
        this.showToast(res.message, 'success');
        this.loadEntregaOrdenes();
      } catch (e) { this.showToast(e.message, 'error'); }
    },
    async eliminarRecepcion(numero_orden_compra) {
      if (!confirm(`¿Está seguro de que desea eliminar el registro de Recepción para la orden ${numero_orden_compra}?`)) return;
      try {
        const res = await this.fetchAuth(`/api/compras/entrega-orden/${numero_orden_compra}/recepcion`, { method: 'DELETE' });
        this.showToast(res.message, 'success');
        this.loadEntregaOrdenes();
      } catch (e) { this.showToast(e.message, 'error'); }
    },

    // Entrega Expediente
    async loadEntregaExpedientes() {
      try { this.entregaExpedientesList = await this.fetchAuth('/api/compras/entrega-expediente'); } catch (e) { this.showToast(e.message, 'error'); }
    },
    async registrarEntregaExpediente(numero_orden_compra) {
      try {
        const res = await this.fetchAuth('/api/compras/entrega-expediente', {
          method: 'POST',
          body: JSON.stringify({ numero_orden_compra })
        });
        this.showToast(res.message, 'success');
        this.loadEntregaExpedientes();
      } catch (e) { this.showToast(e.message, 'error'); }
    },
    async eliminarEntregaExpediente(numero_orden_compra) {
      if (!confirm(`¿Eliminar la entrega de expediente de la orden ${numero_orden_compra}? Esta acción revertirá el registro.`)) return;
      try {
        const res = await this.fetchAuth(`/api/compras/entrega-expediente/${numero_orden_compra}`, { method: 'DELETE' });
        this.showToast(res.message, 'success');
        this.loadEntregaExpedientes();
      } catch (e) { this.showToast(e.message, 'error'); }
    },
    get filteredEntregaExpedientes() {
      let list = [...this.entregaExpedientesList];

      // Filtro "Solo pendientes de entregar expediente"
      if (this.soloPendientesExpediente) {
        list = list.filter(item => !item.fecha_entrega_expediente && !item.fecha_entrega_expediente_display);
      }

      // Buscador
      if (this.entregaExpedienteSearch && this.entregaExpedienteSearch.trim()) {
        const term = this.entregaExpedienteSearch.toLowerCase().trim();
        list = list.filter(item =>
          (item.numero_pedido && String(item.numero_pedido).toLowerCase().includes(term)) ||
          (item.numero_orden_compra && String(item.numero_orden_compra).toLowerCase().includes(term)) ||
          (item.codigo && String(item.codigo).toLowerCase().includes(term)) ||
          (item.descripcion_producto && item.descripcion_producto.toLowerCase().includes(term)) ||
          (item.nombre_usuario_expediente && item.nombre_usuario_expediente.toLowerCase().includes(term))
        );
      }

      // Ordenamiento
      const key = this.entregaExpedienteSortKey;
      const dir = this.entregaExpedienteSortDir === 'asc' ? 1 : -1;
      list.sort((a, b) => {
        let valA = a[key];
        let valB = b[key];
        if (valA === null || valA === undefined) valA = '';
        if (valB === null || valB === undefined) valB = '';
        if (typeof valA === 'number' && typeof valB === 'number') return (valA - valB) * dir;
        return String(valA).localeCompare(String(valB), undefined, { numeric: true, sensitivity: 'base' }) * dir;
      });
      return list;
    },
    get totalEntregaExpedientePages() {
      return Math.ceil(this.filteredEntregaExpedientes.length / this.entregaExpedientePerPage) || 1;
    },
    get paginatedEntregaExpedientes() {
      const start = (this.entregaExpedientePage - 1) * this.entregaExpedientePerPage;
      return this.filteredEntregaExpedientes.slice(start, start + this.entregaExpedientePerPage);
    },
    sortEntregaExpedientesBy(key) {
      if (this.entregaExpedienteSortKey === key) {
        this.entregaExpedienteSortDir = this.entregaExpedienteSortDir === 'asc' ? 'desc' : 'asc';
      } else {
        this.entregaExpedienteSortKey = key;
        this.entregaExpedienteSortDir = 'asc';
      }
    },


    async loadRecepcionesCompra() {
      try {
        await this.loadOrdenes();
        await this.loadProveedores();
        this.recepcionesCompraList = await this.fetchAuth('/api/compras/recepcion-compra');
      } catch (e) { this.showToast(e.message, 'error'); }
    },
    async saveRecepcionCompra() {
      try {
        const res = await this.fetchAuth('/api/compras/recepcion-compra', {
          method: 'POST',
          body: JSON.stringify(this.newRecepcionCompra)
        });
        this.showToast(res.message, 'success');
        this.showRecepcionCompraModal = false;
        this.newRecepcionCompra = {
          numero_orden_compra: '',
          fecha_ingreso: new Date().toISOString().split('T')[0],
          serie_factura: '',
          numero_factura: '',
          nit: '',
          precio_unitario: ''
        };
        this.loadRecepcionesCompra();
        this.loadDashboard();
      } catch (e) { this.showToast(e.message, 'error'); }
    },
    editRecepcionCompra(r) {
      this.editRecepcionCompraData = {
        id_recepcion_compra: r.id_recepcion_compra,
        numero_orden_compra: r.numero_orden_compra,
        numero_pedido: r.numero_pedido,
        descripcion_producto: r.descripcion_producto,
        codigo: r.codigo,
        cantidad: r.cantidad,
        fecha_ingreso: r.fecha_ingreso ? (typeof r.fecha_ingreso === 'string' ? r.fecha_ingreso.substring(0, 10) : new Date(r.fecha_ingreso).toISOString().split('T')[0]) : '',
        serie_factura: r.serie_factura || '',
        numero_factura: r.numero_factura || '',
        nit: r.nit || '',
        nombre_proveedor: r.nombre_proveedor || '',
        precio_unitario: r.precio_unitario || ''
      };
      this.showEditRecepcionCompraModal = true;
    },
    async saveEditRecepcionCompra() {
      try {
        const { id_recepcion_compra, fecha_ingreso, serie_factura, numero_factura, nit, precio_unitario } = this.editRecepcionCompraData;
        const res = await this.fetchAuth(`/api/compras/recepcion-compra/${id_recepcion_compra}`, {
          method: 'PUT',
          body: JSON.stringify({ fecha_ingreso, serie_factura, numero_factura, nit, precio_unitario })
        });
        this.showToast(res.message, 'success');
        this.showEditRecepcionCompraModal = false;
        this.loadRecepcionesCompra();
      } catch (e) { this.showToast(e.message, 'error'); }
    },
    async deleteRecepcionCompra(id, numero_orden) {
      if (!confirm(`¿Eliminar la recepción de compra de la orden ${numero_orden}? Esta acción es irreversible.`)) return;
      try {
        const res = await this.fetchAuth(`/api/compras/recepcion-compra/${id}`, { method: 'DELETE' });
        this.showToast(res.message, 'success');
        this.loadRecepcionesCompra();
      } catch (e) { this.showToast(e.message, 'error'); }
    }
  }));
});
