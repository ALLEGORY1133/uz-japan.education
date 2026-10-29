from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import Role, User
from .rbac import LEVELS, SECTION_KEYS, SECTIONS, permissions_for


class MeSerializer(serializers.ModelSerializer):
    university_name = serializers.SerializerMethodField()
    custom_role_name = serializers.SerializerMethodField()
    permissions = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "role", "custom_role_name", "permissions", "university", "university_name", "last_login", "date_joined"]
        read_only_fields = fields

    def get_custom_role_name(self, obj):
        return obj.custom_role.name if obj.custom_role_id else None

    def get_permissions(self, obj):
        return permissions_for(obj)

    def get_university_name(self, obj):
        return obj.university.name if obj.university_id else None


class LoginSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user
        if not user.has_panel_access:
            raise serializers.ValidationError(
                "Bu hisob universitetga biriktirilmagan. Administratorga murojaat qiling."
            )
        data["user"] = MeSerializer(user).data
        return data


class UserAdminSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, allow_blank=False, min_length=8)
    custom_role_name = serializers.CharField(source="custom_role.name", read_only=True, default=None)
    role_key = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = [
            "id", "username", "email", "first_name", "last_name",
            "role", "role_key", "custom_role", "custom_role_name", "university", "is_active", "password", "date_joined",
        ]
        read_only_fields = ["date_joined"]

    def to_representation(self, obj):
        data = super().to_representation(obj)
        data["role_key"] = f"custom:{obj.custom_role_id}" if obj.role == User.Role.CUSTOM and obj.custom_role_id else obj.role
        return data

    def validate(self, attrs):
        key = attrs.pop("role_key", None)
        if key:
            if key.startswith("custom:"):
                role = Role.objects.filter(pk=key.split(":", 1)[1] or 0).first() if key.split(":", 1)[1].isdigit() else None
                if not role:
                    raise serializers.ValidationError({"role_key": "Rol topilmadi."})
                attrs["role"], attrs["custom_role"] = User.Role.CUSTOM, role
            elif key in dict(User.Role.choices) and key != User.Role.CUSTOM:
                attrs["role"] = key
            else:
                raise serializers.ValidationError({"role_key": "Notöğri rol."})
        role = attrs.get("role", getattr(self.instance, "role", None))
        university = attrs.get("university", getattr(self.instance, "university", None))
        if role == User.Role.UNIVERSITY_REP and not university:
            raise serializers.ValidationError({"university": "Universitet vakili uçun universitet tanlang."})
        if role == User.Role.CUSTOM:
            if not attrs.get("custom_role", getattr(self.instance, "custom_role", None)):
                raise serializers.ValidationError({"custom_role": "Maxsus rol uçun rolni tanlang."})
        else:
            attrs["custom_role"] = None
        if self.instance is None and not attrs.get("password"):
            raise serializers.ValidationError({"password": "Parol majburiy."})
        return attrs

    def validate_password(self, value):
        validate_password(value)
        return value

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        for k, v in validated_data.items():
            setattr(instance, k, v)
        if password:
            instance.set_password(password)
        instance.save()
        return instance


class RoleSerializer(serializers.ModelSerializer):
    user_count = serializers.IntegerField(source="users.count", read_only=True)

    class Meta:
        model = Role
        fields = ["id", "name", "description", "permissions", "user_count", "created_at"]
        read_only_fields = ["created_at"]

    def validate_permissions(self, value):
        if not isinstance(value, dict):
            raise serializers.ValidationError("Ruxsatlar luğat bölişi kerak.")
        clean = {}
        for k, v in value.items():
            if k not in SECTION_KEYS:
                raise serializers.ValidationError(f"Noma’lum bölim: {k}")
            if v in LEVELS:
                clean[k] = v
            elif v not in (None, "", "none"):
                raise serializers.ValidationError(f"{k}: ruxsat 'view' yoki 'edit' bölishi kerak.")
        return clean
