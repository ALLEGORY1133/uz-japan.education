from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import User


class MeSerializer(serializers.ModelSerializer):
    university_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "role", "university", "university_name", "last_login", "date_joined"]
        read_only_fields = fields

    def get_university_name(self, obj):
        return obj.university.name if obj.university_id else None


class LoginSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user
        if not (user.is_platform_admin or (user.is_university_rep and user.university_id)):
            raise serializers.ValidationError(
                "Bu hisob universitetga biriktirilmagan. Administratorga murojaat qiling."
            )
        data["user"] = MeSerializer(user).data
        return data


class UserAdminSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, allow_blank=False, min_length=8)

    class Meta:
        model = User
        fields = [
            "id", "username", "email", "first_name", "last_name",
            "role", "university", "is_active", "password", "date_joined",
        ]
        read_only_fields = ["date_joined"]

    def validate(self, attrs):
        role = attrs.get("role", getattr(self.instance, "role", None))
        university = attrs.get("university", getattr(self.instance, "university", None))
        if role == User.Role.UNIVERSITY_REP and not university:
            raise serializers.ValidationError({"university": "Universitet vakili uçun universitet tanlang."})
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
