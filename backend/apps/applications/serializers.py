from rest_framework import serializers

from apps.universities.models import University

from .models import Inquiry, Application, ApplicationDocument

def active_application_for(email, exclude_pk=None):
    """Bitta email bilan faqat bitta faol ariza: universitet admini rad etgandagina qayta topshiriladi."""
    qs = Application.objects.filter(email__iexact=(email or "").strip(), is_submitted=True).exclude(
        status=Application.Status.REJECTED
    )
    if exclude_pk:
        qs = qs.exclude(pk=exclude_pk)
    return qs.first()


EXTRA_FIELDS = ["middle_name", "id_series", "birth_date", "citizenship", "city", "passport_number", "program"]


class ApplicationCreateSerializer(serializers.ModelSerializer):
    """Ochiq forma: universitet slug orqali tanlanadi."""

    university = serializers.SlugRelatedField(
        slug_field="slug", queryset=University.objects.filter(is_published=True)
    )
    # Honeypot: botlar to'ldiradi, odamlar ko'rmaydi
    website = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = Application
        fields = [
            "university", "first_name", "last_name", "email", "phone",
            "degree", "funding", "message", "website", *EXTRA_FIELDS,
        ]
        extra_kwargs = {
            **{k: {"required": False, "allow_blank": True} for k in EXTRA_FIELDS if k != "birth_date"},
            "degree": {"required": False},
            "funding": {"required": False},
            "message": {"required": False, "allow_blank": True},
        }

    def validate_university(self, uni):
        if uni.admission_status == University.AdmissionStatus.CLOSED:
            raise serializers.ValidationError("Bu universitetda qabul yopiq.")
        if uni.apply_mode == University.ApplyMode.EXTERNAL:
            raise serializers.ValidationError("Bu universitet arizani öz saytida qabul qiladi.")
        return uni

    def validate(self, attrs):
        attrs.pop("website", None)
        attrs.setdefault("degree", Application.Degree.BACHELOR)
        attrs.setdefault("funding", Application.Funding.CONTRACT)
        if active_application_for(attrs.get("email", "")):
            raise serializers.ValidationError({"email": ["email_taken"]}, code="email_taken")
        return attrs


class ApplicationDocumentSerializer(serializers.ModelSerializer):
    doc_type_label = serializers.CharField(source="get_doc_type_display", read_only=True)

    class Meta:
        model = ApplicationDocument
        fields = ["id", "doc_type", "doc_type_label", "original_name", "size", "scan_status", "lang_checked", "created_at"]
        read_only_fields = fields


class AdminApplicationSerializer(serializers.ModelSerializer):
    university_name = serializers.SerializerMethodField()
    documents = ApplicationDocumentSerializer(many=True, read_only=True)

    class Meta:
        model = Application
        fields = [
            "id", "university", "university_name", "first_name", "last_name",
            "email", "phone", "degree", "funding", "message", *EXTRA_FIELDS,
            "tracking_code", "submitted_at", "documents",
            "status", "internal_note", "created_at", "updated_at",
        ]
        # Vakil faqat holat va ichki izohni o'zgartiradi
        read_only_fields = [
            "university", "first_name", "last_name", "email", "phone",
            "degree", "funding", "message", *EXTRA_FIELDS,
            "tracking_code", "submitted_at", "created_at", "updated_at",
        ]

    def get_university_name(self, obj):
        return obj.university.name


class InquirySerializer(serializers.ModelSerializer):
    class Meta:
        model = Inquiry
        fields = ["name", "email", "phone", "interest", "message"]
        extra_kwargs = {"name": {"max_length": 120}, "message": {"max_length": 2000}}

    def validate_name(self, v):
        v = v.strip()
        if len(v) < 2:
            raise serializers.ValidationError("Ismni kiriting.")
        return v


class InquiryAdminSerializer(serializers.ModelSerializer):
    interest_label = serializers.CharField(source="get_interest_display", read_only=True)
    replied_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Inquiry
        fields = ["id", "name", "email", "phone", "interest", "interest_label", "message", "is_handled", "reply", "replied_at", "replied_by_name", "created_at"]
        read_only_fields = ["name", "email", "phone", "interest", "message", "replied_at", "created_at"]
        extra_kwargs = {"reply": {"max_length": 4000}}

    def get_replied_by_name(self, obj):
        u = obj.replied_by
        return (u.get_full_name() or u.username) if u else ""
