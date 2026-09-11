import { OrganizationList } from '@clerk/nextjs';

export default function OnboardingPage() {
  return (
    <div className="w-full max-w-md space-y-6 animate-in fade-in-50 duration-200">
      <div className="space-y-1.5 text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Create or Select a Workspace
        </h1>
        <p className="text-xs text-muted-foreground">
          Choose a workspace to manage your quizzes, classrooms, and assessments.
        </p>
      </div>

      <div className="flex justify-center">
        <OrganizationList
          hidePersonal={true}
          afterCreateOrganizationUrl="/dashboard"
          afterSelectOrganizationUrl="/dashboard"
        />
      </div>
    </div>
  );
}
