import { Box, Typography } from '@mui/material';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import RadioButtonUncheckedOutlinedIcon from '@mui/icons-material/RadioButtonUncheckedOutlined';
import { getPasswordRuleStatus } from '../utils/passwordValidation';

export default function PasswordRequirements({ password }) {
  const rules = getPasswordRuleStatus(password);

  return (
    <Box sx={{ mt: 1 }}>
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
        La contraseña debe cumplir:
      </Typography>
      {rules.map((rule) => (
        <Box key={rule.key} sx={{ display: 'flex', alignItems: 'center', gap: 0.75, py: 0.25 }}>
          {rule.valid ? (
            <CheckCircleOutlineOutlinedIcon sx={{ fontSize: 16, color: 'success.main' }} />
          ) : (
            <RadioButtonUncheckedOutlinedIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
          )}
          <Typography variant="caption" color={rule.valid ? 'success.main' : 'text.secondary'}>
            {rule.label}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
