export const CLINIC_SELECTION_KEYS = {
    clinicId: 'selectedClinicId',
    companyId: 'selectedCompanyId',
    clinicName: 'selectedClinicName',
    companyName: 'selectedCompanyName',
    role: 'selectedClinicRole'
};

export const getStoredSelection = () => {
    if (typeof window === 'undefined') {
        return { clinicId: null, companyId: null, clinicName: null, companyName: null, role: null };
    }

    return {
        clinicId: localStorage.getItem(CLINIC_SELECTION_KEYS.clinicId),
        companyId: localStorage.getItem(CLINIC_SELECTION_KEYS.companyId),
        clinicName: localStorage.getItem(CLINIC_SELECTION_KEYS.clinicName),
        companyName: localStorage.getItem(CLINIC_SELECTION_KEYS.companyName),
        role: localStorage.getItem(CLINIC_SELECTION_KEYS.role)
    };
};

export const persistSelection = ({ clinicId, companyId, clinicName, companyName, role }) => {
    if (typeof window === 'undefined') return;
    if (clinicId !== undefined && clinicId !== null) {
        localStorage.setItem(CLINIC_SELECTION_KEYS.clinicId, String(clinicId));
    }
    if (companyId !== undefined && companyId !== null) {
        localStorage.setItem(CLINIC_SELECTION_KEYS.companyId, String(companyId));
    }
    if (clinicName) {
        localStorage.setItem(CLINIC_SELECTION_KEYS.clinicName, clinicName);
    }
    if (companyName) {
        localStorage.setItem(CLINIC_SELECTION_KEYS.companyName, companyName);
    }
    if (role) {
        localStorage.setItem(CLINIC_SELECTION_KEYS.role, role);
    }
};

export const clearSelection = () => {
    if (typeof window === 'undefined') return;
    Object.values(CLINIC_SELECTION_KEYS).forEach((key) => localStorage.removeItem(key));
};
