from rest_framework import serializers

from apps.core.serializers import AdminModelSerializer, BaseModelSerializer

from .models import Program, Requirement, University, UniversityMedia, UsefulLink

# ---------------------------------------------------------------- ochiq (public)


class PublicRequirementSerializer(BaseModelSerializer):
    class Meta:
        model = Requirement
        fields = ["id", "title", "detail"]


class PublicProgramSerializer(BaseModelSerializer):
    class Meta:
        model = Program
        fields = ["id", "level", "name"]


class PublicMediaSerializer(BaseModelSerializer):
    class Meta:
        model = UniversityMedia
        fields = ["id", "kind", "slot", "file", "video_url", "caption"]


class PublicLinkSerializer(BaseModelSerializer):
    class Meta:
        model = UsefulLink
        fields = ["id", "title", "description", "url", "is_external", "icon"]


class UniversityListSerializer(BaseModelSerializer):
    degrees = serializers.SerializerMethodField()
    admission_status = serializers.SerializerMethodField()

    class Meta:
        model = University
        fields = [
            "id", "slug", "country", "city", "name", "short_name", "native_name",
            "logo", "banner", "brand_color", "website_url", "admission_status",
            "application_deadline", "degrees",
        ]

    def get_admission_status(self, obj):
        return obj.effective_status

    def get_degrees(self, obj):
        out = []
        if obj.has_bachelor:
            out.append("bachelor")
        if obj.has_master:
            out.append("master")
        if obj.has_doctoral:
            out.append("doctoral")
        return out


class UniversityDetailSerializer(UniversityListSerializer):
    requirements = PublicRequirementSerializer(many=True, read_only=True)
    programs = PublicProgramSerializer(many=True, read_only=True)
    media = serializers.SerializerMethodField()
    links = serializers.SerializerMethodField()

    class Meta(UniversityListSerializer.Meta):
        fields = UniversityListSerializer.Meta.fields + [
            "description", "admission_url", "contact_email", "contact_phone",
            "instruction_language", "apply_mode", "apply_url",
            "application_start", "results_date", "term_start",
            "contract_fee", "payment_terms", "living_cost",
            "grant_name", "grant_coverage", "grant_criteria",
            "latitude", "longitude",
            "requirements", "programs", "media", "links",
        ]

    def get_media(self, obj):
        qs = [m for m in obj.media.all() if m.is_visible]
        return PublicMediaSerializer(qs, many=True, context=self.context).data

    def get_links(self, obj):
        qs = [l for l in obj.links.all() if l.is_visible]
        return PublicLinkSerializer(qs, many=True, context=self.context).data


# ---------------------------------------------------------------- admin


class AdminUniversitySerializer(AdminModelSerializer):
    # Vakil o'zgartira olmaydigan maydonlar
    REP_READ_ONLY = ("slug", "country", "is_published", "sort_order")

    class Meta:
        model = University
        fields = "__all__"
        read_only_fields = ["created_at", "updated_at"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if user is not None and user.is_authenticated and not user.is_platform_admin:
            for name in self.REP_READ_ONLY:
                if name in self.fields:
                    self.fields[name].read_only = True

    def validate(self, attrs):
        mode = attrs.get("apply_mode", getattr(self.instance, "apply_mode", None))
        url = attrs.get("apply_url", getattr(self.instance, "apply_url", ""))
        if mode == University.ApplyMode.EXTERNAL and not url:
            raise serializers.ValidationError({"apply_url": "Taşqi ariza uçun havola kiriting."})
        return attrs


class _ScopedChildSerializer(AdminModelSerializer):
    """Universitetga bog'langan bolalar: vakil uchun university avtomatik qo'yiladi."""

    def get_extra_kwargs(self):
        extra = super().get_extra_kwargs()
        uni = extra.get("university", {})
        uni.update({"required": False, "allow_null": True})
        extra["university"] = uni
        return extra


class AdminRequirementSerializer(_ScopedChildSerializer):
    class Meta:
        model = Requirement
        fields = "__all__"


class AdminProgramSerializer(_ScopedChildSerializer):
    class Meta:
        model = Program
        fields = "__all__"


class AdminUniversityMediaSerializer(_ScopedChildSerializer):
    class Meta:
        model = UniversityMedia
        fields = "__all__"

    def validate(self, attrs):
        inst = self.instance
        kind = attrs.get("kind", getattr(inst, "kind", UniversityMedia.Kind.IMAGE))
        has_file = bool(attrs.get("file") or (inst and inst.file))
        has_url = bool(attrs.get("video_url", getattr(inst, "video_url", "")))
        if kind == UniversityMedia.Kind.IMAGE and not has_file:
            raise serializers.ValidationError({"file": "Rasm uçun fayl yuklang."})
        if kind == UniversityMedia.Kind.VIDEO and not (has_file or has_url):
            raise serializers.ValidationError({"video_url": "Video fayl yoki havola kiriting."})
        return attrs


class AdminUsefulLinkSerializer(_ScopedChildSerializer):
    class Meta:
        model = UsefulLink
        fields = "__all__"
