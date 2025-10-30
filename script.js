// ===== SISTEMA DE CONSULTA CEP - ViaCEP API =====

class CEPManager {
    constructor() {
        this.apiURL = 'https://viacep.com.br/ws/';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupValidation();
    }

    // Configurar eventos
    setupEventListeners() {
        const cepInput = document.getElementById('cep');
        const clearBtn = document.getElementById('clearBtn');
        const form = document.getElementById('addressForm');

        // Evento para buscar CEP
        cepInput.addEventListener('blur', () => this.searchCEP());
        cepInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.searchCEP();
            }
        });

        // Máscara para CEP
        cepInput.addEventListener('input', (e) => this.applyCEPMask(e.target));

        // Limpar formulário
        clearBtn.addEventListener('click', () => this.clearForm());

        // Envio do formulário
        form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    // Aplicar máscara no CEP
    applyCEPMask(input) {
        let value = input.value.replace(/\D/g, '');
        if (value.length <= 8) {
            value = value.replace(/^(\d{5})(\d)/, '$1-$2');
            input.value = value;
        }
    }

    // Validar formato do CEP
    validateCEP(cep) {
        const cleanCEP = cep.replace(/\D/g, '');
        return /^[0-9]{8}$/.test(cleanCEP);
    }

    // Buscar CEP na API
    async searchCEP() {
        const cepInput = document.getElementById('cep');
        const cep = cepInput.value.replace(/\D/g, '');

        // Limpar mensagens anteriores
        this.clearMessages();

        if (!this.validateCEP(cep)) {
            if (cep.length > 0) {
                this.showMessage('CEP deve conter 8 dígitos', 'danger');
                this.markFieldAsInvalid(cepInput);
            }
            return;
        }

        try {
            this.showLoader(true);
            const response = await fetch(`${this.apiURL}${cep}/json/`);
            const data = await response.json();

            if (data.erro) {
                throw new Error('CEP não encontrado');
            }

            this.fillAddressFields(data);
            this.showMessage('CEP encontrado com sucesso!', 'success');
            this.markFieldAsValid(cepInput);

        } catch (error) {
            this.showMessage('CEP não encontrado. Verifique o número digitado.', 'danger');
            this.markFieldAsInvalid(cepInput);
            this.clearAddressFields();
        } finally {
            this.showLoader(false);
        }
    }

    // Preencher campos de endereço
    fillAddressFields(data) {
        const fields = {
            'street': data.logradouro || '',
            'neighborhood': data.bairro || '',
            'city': data.localidade || '',
            'state': data.uf || ''
        };

        Object.entries(fields).forEach(([fieldId, value]) => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.value = value;
                
                if (value) {
                    this.markFieldAsValid(field);
                } else {
                    field.classList.remove('is-valid', 'is-invalid');
                }
            }
        });

        // Animar campos preenchidos
        this.animateFields();
    }

    // Limpar campos de endereço
    clearAddressFields() {
        const fields = ['street', 'neighborhood', 'city', 'state'];
        fields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.value = '';
                field.classList.remove('is-valid', 'is-invalid');
            }
        });
    }

    // Limpar formulário completo
    clearForm() {
        const form = document.getElementById('addressForm');
        form.reset();
        
        // Remover classes de validação
        const inputs = form.querySelectorAll('.form-control');
        inputs.forEach(input => {
            input.classList.remove('is-valid', 'is-invalid');
        });

        this.clearMessages();
        document.getElementById('cep').focus();
    }

    // Mostrar/ocultar loader
    showLoader(show) {
        const loader = document.getElementById('cepLoader');
        if (loader) {
            loader.style.display = show ? 'block' : 'none';
        }
    }

    // Mostrar mensagens
    showMessage(message, type) {
        const container = document.getElementById('messageContainer');
        if (!container) return;

        const alertDiv = document.createElement('div');
        alertDiv.className = `alert-custom alert-${type}-custom fade-in`;
        alertDiv.innerHTML = `
            <i class="fas fa-${this.getIconForType(type)}"></i>
            ${message}
        `;

        container.innerHTML = '';
        container.appendChild(alertDiv);

        // Auto-remover mensagem de sucesso após 3 segundos
        if (type === 'success') {
            setTimeout(() => {
                if (alertDiv.parentNode) {
                    alertDiv.remove();
                }
            }, 3000);
        }
    }

    // Limpar mensagens
    clearMessages() {
        const container = document.getElementById('messageContainer');
        if (container) {
            container.innerHTML = '';
        }
    }

    // Obter ícone para tipo de mensagem
    getIconForType(type) {
        const icons = {
            'success': 'check-circle',
            'danger': 'exclamation-triangle',
            'info': 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    // Marcar campo como válido
    markFieldAsValid(field) {
        field.classList.remove('is-invalid');
        field.classList.add('is-valid');
    }

    // Marcar campo como inválido
    markFieldAsInvalid(field) {
        field.classList.remove('is-valid');
        field.classList.add('is-invalid');
    }

    // Animar campos preenchidos
    animateFields() {
        const fields = ['street', 'neighborhood', 'city', 'state'];
        fields.forEach((fieldId, index) => {
            const field = document.getElementById(fieldId);
            if (field && field.value) {
                setTimeout(() => {
                    field.classList.add('pulse');
                    setTimeout(() => {
                        field.classList.remove('pulse');
                    }, 600);
                }, index * 100);
            }
        });
    }

    // Configurar validação do formulário
    setupValidation() {
        const form = document.getElementById('addressForm');
        const inputs = form.querySelectorAll('.form-control[required]');

        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => {
                if (input.classList.contains('is-invalid')) {
                    this.validateField(input);
                }
            });
        });
    }

    // Validar campo individual
    validateField(field) {
        const value = field.value.trim();
        
        if (field.hasAttribute('required') && !value) {
            this.markFieldAsInvalid(field);
            return false;
        }

        if (field.id === 'cep' && !this.validateCEP(value)) {
            this.markFieldAsInvalid(field);
            return false;
        }

        this.markFieldAsValid(field);
        return true;
    }

    // Lidar com envio do formulário
    handleSubmit(event) {
        event.preventDefault();
        
        const form = event.target;
        const inputs = form.querySelectorAll('.form-control[required]');
        let isValid = true;

        // Validar todos os campos
        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isValid = false;
            }
        });

        if (isValid) {
            this.submitForm(form);
        } else {
            this.showMessage('Por favor, preencha todos os campos obrigatórios corretamente.', 'danger');
        }
    }

    // Enviar formulário
    submitForm(form) {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);

        // Simular envio (aqui você integraria com seu backend)
        this.showMessage('Formulário enviado com sucesso!', 'success');
        
        // Log dos dados para demonstração
        console.log('Dados do formulário:', data);
        
        // Opcional: limpar formulário após envio
        setTimeout(() => {
            this.clearForm();
        }, 2000);
    }
}

// Utilitários adicionais
class Utils {
    // Formatar CEP para exibição
    static formatCEP(cep) {
        const clean = cep.replace(/\D/g, '');
        return clean.replace(/^(\d{5})(\d{3})$/, '$1-$2');
    }

    // Validar campo obrigatório
    static validateRequired(value) {
        return value && value.trim().length > 0;
    }

    // Capitalizar primeira letra
    static capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    new CEPManager();
    
    // Adicionar tooltip nos campos
    const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltips.forEach(tooltip => {
        new bootstrap.Tooltip(tooltip);
    });
});

// Exportar para uso global se necessário
window.CEPManager = CEPManager;
window.Utils = Utils;