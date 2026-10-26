from rest_framework import serializers

from apps.core.serializers import AdminModelSerializer, BaseModelSerializer

from .models import HeroSlide, HeroSlideImage, MediaKind, News, NewsMedia, SiteMedia, SiteSettings, Stat

# ---------------------------------------------------------------- ochiq


class PublicHeroSlideSerializer(BaseModelSerializer):
    images = serializers.SerializerMethodField()

    def get_images(self, obj):
        return [i.image.url for i in obj.images.all() if i.image]

    class Meta:
        model = HeroSlide
        fields = [
            "images",
            "id", "eyebrow", "title", "highlight", "description",
            "primary_label", "primary_url", "secondary_label", "secondary_url",
            "theme", "media_kind", "image", "video", "video_url",
        ]


class PublicSiteMediaSerializer(BaseModelSerializer):
    class Meta:
        model = SiteMedia
        fields = ["key", "kind", "image", "video", "video_url", "caption"]


class PublicNewsListSerializer(BaseModelSerializer):
    href = serializers.SerializerMethodField()

    class Meta:
        model = News
        fields = [
            "id", "slug", "title", "summary", "category", "cover",
            "link_type", "external_url", "source_name", "published_at",
            "event_starts_at", "event_location", "href",
        ]

    def get_href(self, obj):
        """Frontend uchun tayyor manzil: tashqi bo'lsa URL, ichki bo'lsa /news/<slug>."""
        if obj.link_type == News.LinkType.EXTERNAL and obj.external_url:
            return obj.external_url
        return f"/news/{obj.slug}"


class PublicNewsMediaSerializer(BaseModelSerializer):
    class Meta:
        model = NewsMedia
        fields = ["id", "kind", "file", "video_url", "caption"]


class PublicNewsDetailSerializer(PublicNewsListSerializer):
    media = PublicNewsMediaSerializer(many=True, read_only=True)

    class Meta(PublicNewsListSerializer.Meta):
        fields = PublicNewsListSerializer.Meta.fields + ["body", "media"]


class PublicStatSerializer(BaseModelSerializer):
    class Meta:
        model = Stat
        fields = ["id", "label", "value", "suffix"]


class PublicSiteSettingsSerializer(BaseModelSerializer):
    class Meta:
        model = SiteSettings
        fields = [
            "contact_email", "contact_phone", "address",
            "telegram_url", "youtube_url", "linkedin_url", "instagram_url",
        ]


# ---------------------------------------------------------------- admin


def _check_media(attrs, instance, kind_field, kind_value_video="video"):
    """Slayd/sayt media: tanlangan turga mos fayl yoki havola bo'lishini tekshiradi."""
    kind = attrs.get(kind_field, getattr(instance, kind_field, None))

    def has(name):
        if name in attrs:
            return bool(attrs[name])
        return bool(getattr(instance, name, None)) if instance else False

    if kind == MediaKind.IMAGE and not has("image"):
        raise serializers.ValidationError({"image": "Rasm yuklang."})
    if kind == MediaKind.VIDEO and not (has("video") or has("video_url")):
        raise serializers.ValidationError({"video_url": "Video fayl yoki havola kiriting."})


class AdminHeroSlideSerializer(AdminModelSerializer):
    class Meta:
        model = HeroSlide
        fields = "__all__"

    def validate(self, attrs):
        _check_media(attrs, self.instance, "media_kind")
        return attrs


class AdminSiteMediaSerializer(AdminModelSerializer):
    class Meta:
        model = SiteMedia
        fields = "__all__"

    def validate(self, attrs):
        _check_media(attrs, self.instance, "kind")
        return attrs


class AdminNewsSerializer(AdminModelSerializer):
    class Meta:
        model = News
        fields = "__all__"
        extra_kwargs = {"slug": {"required": False, "allow_blank": True}}

    def validate(self, attrs):
        link_type = attrs.get("link_type", getattr(self.instance, "link_type", None))
        url = attrs.get("external_url", getattr(self.instance, "external_url", ""))
        if link_type == News.LinkType.EXTERNAL and not url:
            raise serializers.ValidationError({"external_url": "Taşqi manba uçun havola kiriting."})
        return attrs


class AdminStatSerializer(AdminModelSerializer):
    class Meta:
        model = Stat
        fields = "__all__"


class AdminSiteSettingsSerializer(AdminModelSerializer):
    class Meta:
        model = SiteSettings
        fields = "__all__"


class AdminNewsMediaSerializer(AdminModelSerializer):
    class Meta:
        model = NewsMedia
        fields = "__all__"

    def validate(self, attrs):
        kind = attrs.get("kind", getattr(self.instance, "kind", "image"))
        has_file = bool(attrs.get("file") or (self.instance and self.instance.file))
        url = attrs.get("video_url", getattr(self.instance, "video_url", ""))
        if kind == "image" and not has_file:
            raise serializers.ValidationError({"file": "Rasm yuklang."})
        if kind == "video" and not (has_file or url):
            raise serializers.ValidationError({"video_url": "Video fayl yoki havola kiriting."})
        return attrs


class AdminHeroSlideImageSerializer(AdminModelSerializer):
    class Meta:
        model = HeroSlideImage
        fields = "__all__"
