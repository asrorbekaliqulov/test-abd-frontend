import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Phone, ArrowRight, AlertCircle } from 'lucide-react';
import { authAPI } from '../../utils/api';

interface Country {
    id: number;
    name: string;
    code: string;
}

interface Region {
    id: number;
    name: string;
    country: number;
}

interface District {
    id: number;
    name: string;
    region: number;
}

interface Settlement {
    id: number;
    name: string;
    district: number;
}

const CompleteProfilePage: React.FC = () => {
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        phone_number: '',
        country: '',
        region: '',
        district: '',
        settlement: ''
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Location data
    const [countries, setCountries] = useState<Country[]>([]);
    const [regions, setRegions] = useState<Region[]>([]);
    const [districts, setDistricts] = useState<District[]>([]);
    const [settlements, setSettlements] = useState<Settlement[]>([]);

    const navigate = useNavigate();

    useEffect(() => {
        const emailVerified = localStorage.getItem("email_verified");
        const verifiedEmail = localStorage.getItem("verified_email");

        if (emailVerified !== "true" || !verifiedEmail) {
            navigate('/register');
            return;
        }

        // emailni state'ga joylang
        setFormData(prev => ({
            ...prev,
            email: verifiedEmail || ''
        }));

        // Mamlakatlar yuklanadi
        authAPI.getCountry().then(res => {
            setCountries(res.data);
        }).catch(err => {
            console.error('Error loading countries:', err);
        });
    }, []);
    

    useEffect(() => {
        if (formData.country) {
            authAPI.getRegion(parseInt(formData.country)).then(response => {
                const data = response;
                setRegions(data.data);
            }).catch(err => {
                console.error('Error loading regions:', err);
                setFormData(prev => ({ ...prev, region: '', district: '', settlement: '' }));
            });
            setFormData(prev => ({ ...prev, region: '', district: '', settlement: '' }));
        }
    }, [formData.country]);

    useEffect(() => {
        if (formData.region) {
            authAPI.getDistrict(parseInt(formData.region)).then(response => {
                const data = response.data;
                setDistricts(data);
            }).catch(err => {
                console.error('Error loading districts:', err);
                setFormData(prev => ({ ...prev, district: '', settlement: '' }));
            });
        }
    }, [formData.region]);

    useEffect(() => {
        if (formData.district) {
            authAPI.getSettlement(parseInt(formData.district)).then(response => {
                const data = response.data;
                setSettlements(data);
            }).catch(err => {
                console.error('Error loading settlements:', err);
                setFormData(prev => ({ ...prev, settlement: '' }));
            });
        } else {
            setSettlements([]);
            setFormData(prev => ({ ...prev, settlement: '' }));
        }
    }, [formData.district]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const completeData = {
                first_name: formData.first_name,
                last_name: formData.last_name,
                phone_number: formData.phone_number || undefined,
                country: formData.country ? parseInt(formData.country) : undefined,
                region: formData.region ? parseInt(formData.region) : undefined,
                district: formData.district ? parseInt(formData.district) : undefined,
                settlement: formData.settlement ? parseInt(formData.settlement) : undefined
            };

            await authAPI.updateProfile(completeData);
            navigate('/');
        } catch (err: any) {
            setError(err.message || 'Profilni to\'ldirishda xatolik yuz berdi');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-green-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <User size={32} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Profilni to'ldiring</h1>
                    <p className="text-gray-600">Qo'shimcha ma'lumotlaringizni kiriting</p>
                </div>

                {/* Form */}
                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3">
                            <AlertCircle size={20} className="text-red-500 flex-shrink-0" />
                            <span className="text-red-700 text-sm">{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Name Fields */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Ism
                                </label>
                                <input
                                    type="text"
                                    name="first_name"
                                    value={formData.first_name}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="Ismingiz"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Familiya
                                </label>
                                <input
                                    type="text"
                                    name="last_name"
                                    value={formData.last_name}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="Familiyangiz"
                                />
                            </div>
                        </div>

                        {/* Phone (Optional) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Telefon raqami (ixtiyoriy)
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Phone size={20} className="text-gray-400" />
                                </div>
                                <input
                                    type="tel"
                                    name="phone_number"
                                    value={formData.phone_number}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="+998 90 123 45 67"
                                />
                            </div>
                        </div>

                        {/* Location Fields */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Mamlakat
                                </label>
                                <select
                                    name="country"
                                    value={formData.country}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                >
                                    <option value="">Mamlakatni tanlang</option>
                                    {countries?.map(country => (
                                        <option key={country.id} value={country.id}>
                                            {country.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {formData.country && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Viloyat
                                    </label>
                                    <select
                                        name="region"
                                        value={formData.region}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    >
                                        <option value="">Viloyatni tanlang</option>
                                        {regions.map(region => (
                                            <option key={region.id} value={region.id}>
                                                {region.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {formData.region && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Tuman
                                    </label>
                                    <select
                                        name="district"
                                        value={formData.district}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    >
                                        <option value="">Tumanni tanlang</option>
                                        {districts.map(district => (
                                            <option key={district.id} value={district.id}>
                                                {district.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {formData.district && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Aholi punkti
                                    </label>
                                    <select
                                        name="settlement"
                                        value={formData.settlement}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    >
                                        <option value="">Aholi punktini tanlang</option>
                                        {settlements.map(settlement => (
                                            <option key={settlement.id} value={settlement.id}>
                                                {settlement.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-green-700 hover:to-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span>Profilni saqlash</span>
                                    <ArrowRight size={20} />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CompleteProfilePage;