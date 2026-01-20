import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { FormSchema } from '@/hooks/useFormTemplates';

interface FormReadOnlyProps {
  schema: FormSchema;
  answers: Record<string, unknown>;
}

function getDisplayValue(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return '—';
  }
  if (typeof value === 'number') {
    return value.toString();
  }
  if (typeof value === 'string') {
    return value;
  }
  return JSON.stringify(value);
}

export default function FormReadOnly({ schema, answers }: FormReadOnlyProps) {
  return (
    <div className="space-y-6">
      {schema.sections.map((section, sectionIndex) => (
        <Card key={sectionIndex}>
          <CardHeader>
            <CardTitle className="text-lg">{section.title}</CardTitle>
            {section.description && (
              <CardDescription>{section.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {section.fields.map((field) => (
              <div key={field.key} className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  {field.label}
                </p>
                <p className="text-foreground whitespace-pre-wrap">
                  {getDisplayValue(answers[field.key])}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
