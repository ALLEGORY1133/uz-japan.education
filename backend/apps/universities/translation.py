from modeltranslation.translator import TranslationOptions, register

from .models import Program, Requirement, University, UniversityMedia, UsefulLink


@register(University)
class UniversityTR(TranslationOptions):
    fields = (
        "city", "name", "description", "instruction_language",
        "contract_fee", "payment_terms", "living_cost",
        "grant_name", "grant_coverage", "grant_criteria",
    )


@register(Requirement)
class RequirementTR(TranslationOptions):
    fields = ("title", "detail")


@register(Program)
class ProgramTR(TranslationOptions):
    fields = ("name",)


@register(UniversityMedia)
class UniversityMediaTR(TranslationOptions):
    fields = ("caption",)


@register(UsefulLink)
class UsefulLinkTR(TranslationOptions):
    fields = ("title", "description")
